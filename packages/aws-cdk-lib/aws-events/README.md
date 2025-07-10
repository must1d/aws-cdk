# Amazon EventBridge Construct Library

Amazon EventBridge delivers a near real-time stream of system events that
describe changes in AWS resources. EventBridge was formerly called CloudWatch
Events.

## Rule

The `Rule` construct defines an EventBridge rule which monitors an
event based on an [event pattern](https://docs.aws.amazon.com/eventbridge/latest/userguide/filtering-examples-structure.html)
and invoke event targets when the pattern is matched against a triggered event.

The following example creates a rule that will trigger a CodeBuild project
when a commit is pushed to the "main" branch of a CodeCommit repository:

```ts
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as targets from 'aws-cdk-lib/aws-events-targets';

const repo = new codecommit.Repository(this, 'MyRepo', {
  repositoryName: 'aws-cdk-demo-repo',
});

const project = new codebuild.Project(this, 'MyProject', {
  projectName: 'aws-cdk-demo-project',
  // ...
});

const rule = new events.Rule(this, 'CommitRule', {
  eventPattern: {
    source: ['aws.codecommit'],
    detailType: ['CodeCommit Repository State Change'],
    resources: [repo.repositoryArn],
    detail: {
      event: ['referenceCreated', 'referenceUpdated'],
      referenceType: ['branch'],
      referenceName: ['main'],
    },
  },
  targets: [new targets.CodeBuildProject(project)],
});
```

## Schedule

You can also configure a rule to run on a schedule. The following example
creates a rule that triggers a Lambda function every day at 12:00pm UTC:

```ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-events-targets';

const fn = new lambda.Function(this, 'MyFunc', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline(`exports.handler = ${handler.toString()}`),
});

const rule = new events.Rule(this, 'ScheduleRule', {
  schedule: events.Schedule.cron({
    minute: '0',
    hour: '12',
  }),
  targets: [new targets.LambdaFunction(fn)],
});
```

### Timezone Support

You can specify a timezone for your cron expressions. This is useful when you want your scheduled events to run at a specific time in a specific timezone, especially in regions that observe daylight saving time.

```ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-events-targets';

const fn = new lambda.Function(this, 'MyFunc', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline(`exports.handler = ${handler.toString()}`),
});

const rule = new events.Rule(this, 'ScheduleRule', {
  schedule: events.Schedule.cron({
    minute: '0',
    hour: '8',
    timeZone: 'Europe/London', // Run at 8:00 AM London time
  }),
  targets: [new targets.LambdaFunction(fn)],
});
```

The timezone must be a valid IANA timezone identifier (e.g., "America/New_York", "Europe/London", "Asia/Tokyo"). If no timezone is specified, UTC is used by default.

## Event Targets

The `targets` namespace provides classes that implement the `IRuleTarget`
interface for various AWS services.

The following targets are supported:

* `targets.CodeBuildProject`: Start a CodeBuild build
* `targets.CodePipeline`: Start a CodePipeline pipeline execution
* `targets.EcsTask`: Start a task on an ECS cluster
* `targets.LambdaFunction`: Invoke a Lambda function
* `targets.SnsTopic`: Publish to an SNS topic
* `targets.SqsQueue`: Send a message to an SQS queue
* `targets.StepFunction`: Trigger a Step Function state machine
* `targets.BatchJob`: Queue a Batch job
* `targets.ApiGateway`: Call an API Gateway REST API
* `targets.AwsApi`: Call any AWS API
* `targets.ApiDestination`: Invoke an API destination

## Archiving

The `Archive` construct defines an EventBridge Archive which archives
events based on an [archive pattern](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-archive.html)
and a retention period.

The following example creates an archive that will capture all events
from CodeBuild and retain them for 30 days:

```ts
import * as events from 'aws-cdk-lib/aws-events';

const archive = new events.Archive(this, 'MyArchive', {
  sourceEventBus: eventBus,
  eventPattern: {
    source: ['aws.codebuild'],
  },
  retention: cdk.Duration.days(30),
});
```

## Cross-account and Cross-region Events

You can send events to other account or region via the `EventBus.grantPutEventsTo` method.

The following example creates an event rule that sends all CodeBuild events to an event bus in another account:

```ts
import * as events from 'aws-cdk-lib/aws-events';

// Define the account and region where the target event bus is located
const targetAccount = '123456789012';
const targetRegion = 'us-west-1';

// Create an event bus in the target account
const targetEventBus = events.EventBus.fromEventBusArn(this, 'TargetEventBus',
  `arn:aws:events:${targetRegion}:${targetAccount}:event-bus/default`);

// Grant permission to the current account to put events on the target event bus
targetEventBus.grantPutEventsTo(new iam.AccountPrincipal(this.account));

// Create a rule that sends all CodeBuild events to the target event bus
const rule = new events.Rule(this, 'CrossAccountRule', {
  eventPattern: {
    source: ['aws.codebuild'],
  },
  targets: [new targets.EventBus(targetEventBus)],
});
```