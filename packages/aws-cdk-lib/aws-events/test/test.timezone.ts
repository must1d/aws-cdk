import { Template } from '../../assertions';
import * as cdk from '../../core';
import { TimeZone } from '../../core';
import * as events from '../lib';

describe('EventBridge Schedule with Timezone', () => {
  test('can specify timezone for cron schedule', () => {
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

  test('timezone is optional and defaults to UTC', () => {
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
});
