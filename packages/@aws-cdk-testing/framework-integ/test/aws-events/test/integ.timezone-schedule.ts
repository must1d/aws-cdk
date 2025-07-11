import { App, CfnOutput, Duration, Stack, TimeZone } from 'aws-cdk-lib';
import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

const app = new App();

const stack = new Stack(app, 'TimeZoneScheduleStack');

// Create a Lambda function that will be triggered by the rules
const handler = new Function(stack, 'TestFunction', {
  runtime: Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: Code.fromInline(`
    exports.handler = async (event) => {
      console.log('Event received:', JSON.stringify(event));
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Success',
          timestamp: new Date().toISOString(),
          event
        })
      };
    };
  `),
});

// Create a log group to capture the Lambda function's logs
const logGroup = new LogGroup(stack, 'TestFunctionLogs', {
  logGroupName: `/aws/lambda/${handler.functionName}`,
  retention: RetentionDays.ONE_DAY,
});

// Create a rule with a timezone-specific cron schedule
const nyRule = new Rule(stack, 'TimeZoneRuleNY', {
  schedule: Schedule.cron({
    minute: '0',
    hour: '8',
    timeZone: TimeZone.AMERICA_NEW_YORK,
  }),
  description: 'Rule with America/New_York timezone',
});
nyRule.addTarget(new LambdaFunction(handler));

// Create a rule with a different timezone
const londonRule = new Rule(stack, 'TimeZoneRuleLondon', {
  schedule: Schedule.cron({
    minute: '30',
    hour: '12',
    timeZone: TimeZone.EUROPE_LONDON,
  }),
  description: 'Rule with Europe/London timezone',
});
londonRule.addTarget(new LambdaFunction(handler));

// Create a rule without timezone for comparison
const noTzRule = new Rule(stack, 'NoTimeZoneRule', {
  schedule: Schedule.cron({
    minute: '15',
    hour: '10',
  }),
  description: 'Rule without timezone (defaults to UTC)',
});
noTzRule.addTarget(new LambdaFunction(handler));

// Create a rule with rate expression (which doesn't support timezone)
const rateRule = new Rule(stack, 'RateRule', {
  schedule: Schedule.rate(Duration.hours(1)),
  description: 'Rule with rate expression (no timezone support)',
});
rateRule.addTarget(new LambdaFunction(handler));

// Output the rule names and ARNs for assertions
new CfnOutput(stack, 'NYRuleArn', { value: nyRule.ruleArn });
new CfnOutput(stack, 'LondonRuleArn', { value: londonRule.ruleArn });
new CfnOutput(stack, 'NoTzRuleArn', { value: noTzRule.ruleArn });
new CfnOutput(stack, 'RateRuleArn', { value: rateRule.ruleArn });
new CfnOutput(stack, 'LogGroupName', { value: logGroup.logGroupName });

// Create the integration test
const integ = new IntegTest(app, 'IntegTest-TimeZoneSchedule', {
  testCases: [stack],
});

// Verify the rules exist and have the correct configuration
const nyRuleCheck = integ.assertions.awsApiCall('EventBridge', 'describeRule', {
  Name: nyRule.ruleName,
});

nyRuleCheck.expect(ExpectedResult.objectLike({
  ScheduleExpression: 'cron(0 8 * * ? *)',
  ScheduleExpressionTimezone: 'America/New_York',
  Description: 'Rule with America/New_York timezone',
}));

const londonRuleCheck = integ.assertions.awsApiCall('EventBridge', 'describeRule', {
  Name: londonRule.ruleName,
});

londonRuleCheck.expect(ExpectedResult.objectLike({
  ScheduleExpression: 'cron(30 12 * * ? *)',
  ScheduleExpressionTimezone: 'Europe/London',
  Description: 'Rule with Europe/London timezone',
}));

const noTzRuleCheck = integ.assertions.awsApiCall('EventBridge', 'describeRule', {
  Name: noTzRule.ruleName,
});

noTzRuleCheck.expect(ExpectedResult.objectLike({
  ScheduleExpression: 'cron(15 10 * * ? *)',
  Description: 'Rule without timezone (defaults to UTC)',
}));

// Verify the rate rule doesn't have a timezone
const rateRuleCheck = integ.assertions.awsApiCall('EventBridge', 'describeRule', {
  Name: rateRule.ruleName,
});

rateRuleCheck.expect(ExpectedResult.objectLike({
  ScheduleExpression: 'rate(1 hour)',
  Description: 'Rule with rate expression (no timezone support)',
}));
