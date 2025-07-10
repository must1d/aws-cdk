# Requirements Document

## Introduction

The AWS CDK EventBridge module currently only supports UTC timezone for scheduled rules created through the `Schedule.cron()` method. However, the AWS Console and underlying CloudFormation resources allow users to specify different timezones for EventBridge rules. This feature aims to add timezone support to the `Schedule.cron()` method in the `aws-events` package, allowing users to specify timezones like "Europe/London" for consistent scheduling across daylight saving time changes.

## Requirements

### Requirement 1

**User Story:** As a CDK user, I want to specify a timezone when creating EventBridge scheduled rules, so that my scheduled events run at the appropriate local time without manual console intervention.

#### Acceptance Criteria

1. WHEN a user creates an EventBridge rule with `Schedule.cron()` THEN they SHALL be able to specify a timezone parameter
2. WHEN a user specifies a timezone THEN the CDK SHALL generate CloudFormation with the appropriate `ScheduleExpressionTimezone` property
3. WHEN a user does not specify a timezone THEN the CDK SHALL default to UTC timezone for backward compatibility
4. WHEN a user specifies an invalid timezone THEN the CDK SHALL validate and throw a meaningful error message

### Requirement 2

**User Story:** As a CDK user, I want the timezone implementation to be consistent with other AWS services, so that I have a familiar developer experience across the CDK library.

#### Acceptance Criteria

1. WHEN implementing timezone support THEN the CDK SHALL follow patterns established in other services like EventBridge Scheduler
2. WHEN implementing timezone support THEN the CDK SHALL use the same timezone format as the AWS Console (IANA timezone database names)
3. WHEN implementing timezone support THEN the CDK SHALL maintain backward compatibility with existing code

### Requirement 3

**User Story:** As a CDK user, I want clear documentation and examples for the timezone feature, so that I can easily implement it in my applications.

#### Acceptance Criteria

1. WHEN the feature is released THEN the CDK SHALL provide updated API documentation that includes the new timezone parameter
2. WHEN the feature is released THEN the CDK SHALL provide code examples showing how to use the timezone parameter
3. WHEN the feature is released THEN the CDK SHALL include information about supported timezone formats