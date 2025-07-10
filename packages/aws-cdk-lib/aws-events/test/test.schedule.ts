import { Template } from '../../assertions';
import * as cdk from '../../core';
import { TimeZone } from '../../core';
import * as events from '../lib';

describe('Schedule', () => {
  test('cron with timezone creates rule with timezone', () => {
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

  test('cron without timezone defaults to UTC', () => {
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

  test('cron with invalid timezone throws error', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN/THEN
    expect(() => {
      new events.Rule(stack, 'Rule', {
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '8',
          timeZone: new TimeZone('Invalid/Timezone'),
        }),
      });
    }).toThrow(UnscopedValidationError);
  });

  test('cron with special case timezone UTC is valid', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new events.Rule(stack, 'Rule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '8',
        timeZone: TimeZone.UTC,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 8 * * ? *)',
      ScheduleExpressionTimezone: 'UTC',
    });
  });

  test('cron with special case timezone GMT is valid', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new events.Rule(stack, 'Rule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '8',
        timeZone: TimeZone.GMT,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 8 * * ? *)',
      ScheduleExpressionTimezone: 'GMT',
    });
  });

  test('cron with common timezone formats are valid', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const validTimezones = [
      TimeZone.AMERICA_NEW_YORK,
      TimeZone.EUROPE_LONDON,
      TimeZone.ASIA_TOKYO,
      TimeZone.AUSTRALIA_SYDNEY,
      TimeZone.PACIFIC_HONOLULU,
    ];

    // WHEN/THEN
    validTimezones.forEach((timezone, index) => {
      new events.Rule(stack, `Rule${index}`, {
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '8',
          timeZone: timezone,
        }),
      });

      // THEN
      Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 8 * * ? *)',
        ScheduleExpressionTimezone: timezone.toString(),
      });
    });
  });
});
