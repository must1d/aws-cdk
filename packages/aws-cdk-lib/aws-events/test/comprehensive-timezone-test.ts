import { Template } from '../../assertions';
import * as cdk from '../../core';
import * as events from '../lib';

describe('EventBridge Schedule Timezone Support - Comprehensive Tests', () => {
  describe('Basic Functionality', () => {
    test('can specify timezone for cron schedule', () => {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      new events.Rule(stack, 'Rule', {
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '8',
          timeZone: 'Europe/London',
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

  describe('Timezone Validation', () => {
    test('valid timezone formats pass validation', () => {
      // GIVEN
      const stack = new cdk.Stack();
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Pacific/Honolulu',
        'UTC',
        'GMT',
        'Etc/UTC',
        'Etc/GMT',
      ];

      // WHEN/THEN
      validTimezones.forEach((timezone, index) => {
        expect(() => {
          new events.Rule(stack, `Rule${index}`, {
            schedule: events.Schedule.cron({
              minute: '0',
              hour: '8',
              timeZone: timezone,
            }),
          });
        }).not.toThrow();
      });
    });

    test('invalid timezone formats throw validation error', () => {
      // GIVEN
      const stack = new cdk.Stack();
      const invalidTimezones = [
        'Invalid/Timezone',
        'NotARegion/City',
        'America',
        'London',
        'UTC+1',
        'GMT-5',
        'PST',
        'EST',
      ];

      // WHEN/THEN
      invalidTimezones.forEach(timezone => {
        expect(() => {
          new events.Rule(stack, `Rule-${timezone.replace(/[^a-zA-Z0-9]/g, '-')}`, {
            schedule: events.Schedule.cron({
              minute: '0',
              hour: '8',
              timeZone: timezone,
            }),
          });
        }).toThrow(UnscopedValidationError);
      });
    });
  });

  describe('Complex Cron Expressions', () => {
    test('works with complex cron expressions', () => {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN - Complex expression with specific days and months
      new events.Rule(stack, 'ComplexRule', {
        schedule: events.Schedule.cron({
          minute: '15',
          hour: '10',
          day: '1-15',
          month: 'JAN,JUN,DEC',
          weekDay: 'MON-FRI',
          timeZone: 'America/New_York',
        }),
      });

      // THEN
      Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(15 10 1-15 JAN,JUN,DEC MON-FRI *)',
        ScheduleExpressionTimezone: 'America/New_York',
      });
    });
  });

  describe('Multiple Rules with Different Timezones', () => {
    test('can create multiple rules with different timezones', () => {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      new events.Rule(stack, 'LondonRule', {
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '9',
          timeZone: 'Europe/London',
        }),
      });

      new events.Rule(stack, 'NewYorkRule', {
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '9',
          timeZone: 'America/New_York',
        }),
      });

      new events.Rule(stack, 'TokyoRule', {
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '9',
          timeZone: 'Asia/Tokyo',
        }),
      });

      // THEN
      Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 9 * * ? *)',
        ScheduleExpressionTimezone: 'Europe/London',
      });

      Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 9 * * ? *)',
        ScheduleExpressionTimezone: 'America/New_York',
      });

      Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 9 * * ? *)',
        ScheduleExpressionTimezone: 'Asia/Tokyo',
      });
    });
  });

  describe('Rate Expressions', () => {
    test('rate expressions do not support timezone', () => {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      new events.Rule(stack, 'RateRule', {
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
  });

  describe('Expression Method', () => {
    test('expression method does not include timezone by default', () => {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      new events.Rule(stack, 'ExpressionRule', {
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

  describe('Edge Cases', () => {
    test('empty string timezone throws validation error', () => {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN/THEN
      expect(() => {
        new events.Rule(stack, 'EmptyTimezoneRule', {
          schedule: events.Schedule.cron({
            minute: '0',
            hour: '8',
            timeZone: '',
          }),
        });
      }).toThrow(UnscopedValidationError);
    });

    test('timezone with invalid characters throws validation error', () => {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN/THEN
      expect(() => {
        new events.Rule(stack, 'InvalidCharTimezoneRule', {
          schedule: events.Schedule.cron({
            minute: '0',
            hour: '8',
            timeZone: 'America/New York', // Space is invalid
          }),
        });
      }).toThrow(UnscopedValidationError);
    });
  });
});
