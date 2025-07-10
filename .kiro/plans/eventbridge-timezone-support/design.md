# Design Document: EventBridge Timezone Support

## Overview

This design document outlines the implementation approach for adding timezone support to the `Schedule.cron()` method in the AWS CDK EventBridge module. Currently, EventBridge rules created through CDK only support UTC timezone, while the AWS Console and CloudFormation allow specifying different timezones. This feature will extend the existing API to support timezone specification, making it consistent with other AWS services and eliminating the need for manual console intervention.

## Architecture

The implementation will follow the existing architecture of the AWS CDK EventBridge module, extending the current interfaces and classes rather than creating new ones. This approach ensures backward compatibility and maintains consistency with the rest of the CDK library.

### Key Components to Modify:

1. **CronOptions Interface**: Extend to include an optional `timeZone` parameter
2. **Schedule Class**: Update the `cron()` method to handle the timezone parameter
3. **Rule Class**: Ensure the CloudFormation template generation includes the `ScheduleExpressionTimezone` property

## Components and Interfaces

### 1. CronOptions Interface Extension

The `CronOptions` interface in `packages/aws-cdk-lib/aws-events/lib/schedule.ts` will be extended to include an optional `timeZone` parameter:

```typescript
export interface CronOptions {
  readonly minute?: string;
  readonly hour?: string;
  readonly day?: string;
  readonly month?: string;
  readonly year?: string;
  readonly weekDay?: string;
  readonly timeZone?: string; // New parameter
}
```

### 2. Schedule Class Updates

The `Schedule` class will be updated to handle the new `timeZone` parameter:

```typescript
export class Schedule {
  // Existing static methods...

  public static cron(options: CronOptions): Schedule {
    // Existing cron expression generation...
    
    // Handle timezone if specified
    if (options.timeZone) {
      // Create Schedule with timezone
    } else {
      // Existing behavior (UTC)
    }
  }
}
```

### 3. CloudFormation Integration

The `Rule` class will need to be updated to include the `ScheduleExpressionTimezone` property in the CloudFormation template when a timezone is specified. This will involve modifying how the `Schedule` is translated into CloudFormation properties.

## Data Models

No new data models are required for this feature. We will extend the existing `CronOptions` interface and ensure the CloudFormation template generation includes the `ScheduleExpressionTimezone` property.

### Timezone Validation

We will implement validation for the timezone parameter to ensure it follows the IANA timezone database format (e.g., "America/New_York", "Europe/London"). This validation will help users identify issues early in the development process.

## Error Handling

The implementation will include appropriate error handling for invalid timezone specifications:

1. **Validation Errors**: If an invalid timezone is provided, a clear error message will be thrown during synthesis
2. **Default Behavior**: If no timezone is specified, the system will default to UTC for backward compatibility

## Testing Strategy

The testing strategy will include:

1. **Unit Tests**:
   - Test the `Schedule.cron()` method with various timezone specifications
   - Test backward compatibility with existing code
   - Test error handling for invalid timezones

2. **Integration Tests**:
   - Verify that the CloudFormation template includes the `ScheduleExpressionTimezone` property when a timezone is specified
   - Verify that the default behavior (UTC) is maintained when no timezone is specified

3. **Documentation Tests**:
   - Ensure examples in documentation are correct and functional

## Implementation Considerations

### Backward Compatibility

The implementation must maintain backward compatibility with existing code. The `timeZone` parameter will be optional, defaulting to UTC when not specified.

### CloudFormation Support

The AWS CloudFormation `AWS::Events::Rule` resource supports the `ScheduleExpressionTimezone` property, which will be used to implement this feature. The implementation will ensure that this property is included in the CloudFormation template when a timezone is specified.

### Consistency with Other AWS Services

The implementation will follow patterns established in other AWS services, particularly the EventBridge Scheduler service, which already supports timezone specification. This will ensure a consistent developer experience across the CDK library.

## Documentation Updates

The API documentation will be updated to include information about the new `timeZone` parameter, including:

1. Parameter description and usage
2. Supported timezone formats (IANA timezone database names)
3. Examples showing how to use the timezone parameter
4. Notes on backward compatibility