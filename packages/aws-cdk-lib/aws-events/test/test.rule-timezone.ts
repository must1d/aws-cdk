import { Template } from '../../assertions';
import * as cdk from '../../core';
import { TimeZone } from '../../core';
import * as events from '../lib';

describe('EventBridge Rule with Timezone', () => {
  test('rule with timezone creates CloudFormation with ScheduleExpressionTimezone', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new events.Rule(stack, 'Rule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '8',
        timeZone: TimeZone.EUROPE_LONDON,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 8 * * ? *)',
      ScheduleExpressionTimezone: 'Europe/London',
    });
  });

  test('rule without timezone does not include ScheduleExpressionTimezone in CloudFormation', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new events.Rule(stack, 'Rule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '8',
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 8 * * ? *)',
    });
    Template.fromStack(stack).hasResource('AWS::Events::Rule', {
      Properties: {
        ScheduleExpressionTimezone: cdk.Match.absent(),
      },
    });
  });

  test('rule with rate expression does not support timezone', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new events.Rule(stack, 'Rule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(1 hour)',
    });
    Template.fromStack(stack).hasResource('AWS::Events::Rule', {
      Properties: {
        ScheduleExpressionTimezone: cdk.Match.absent(),
      },
    });
  });

  test('rule with expression does not include timezone by default', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new events.Rule(stack, 'Rule', {
      schedule: events.Schedule.expression('cron(0 8 * * ? *)'),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 8 * * ? *)',
    });
    Template.fromStack(stack).hasResource('AWS::Events::Rule', {
      Properties: {
        ScheduleExpressionTimezone: cdk.Match.absent(),
      },
    });
  });
});
