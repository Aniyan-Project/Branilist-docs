# Forum and Spaces

[Contents](README.md) · [GraphQL](graphql.md) · [Community and notifications](community.md)

Use `POST https://branilist.com/api/graphql` with OAuth Bearer. Request `forum:read` to browse and `forum:write` to publish and interact. Reading and writing are independent: configure the app's scopes and obtain user consent. API keys and anonymous requests cannot access these operations.

## Browse topics

```graphql
query BrowseForum($category: String) {
  forumTopics(filter: {categorySlug: $category}, sort: ACTIVITY, first: 10) {
    nodes {
      id title status pinned featured
      author { id username displayName }
      category { slug name locked }
      tags { id slug name }
      spaceSlug postCount viewerSubscribed
    }
    pageInfo { hasNextPage limit offset }
  }
}
```

`forumTopics` combines optional search text up to 200 characters, `categorySlug`, `tagSlug`, `spaceSlug`, and status `OPEN` or `LOCKED`. Sort by `ACTIVITY`, `RELEVANCE`, `POPULARITY`, or `NEWEST`. Search matches titles, tags, and accessible message bodies; hidden messages do not produce matches. `%` and `_` follow the forum search wildcard rules. Queries do not increment view counts.

`forumTopic(id:)` reads a topic; `forumPost(id:)` reads a message. `forumTopic.posts(first:, offset:)` returns messages in creation order, including the initial message. Removed messages have `removed: true` and an empty body. `parentId` refers to a message in the same topic and is hidden when that message is inaccessible. Revision history and historical editing reasons are not exposed.

## Categories, tags, and Spaces

`forumCategories` and `forumTags` are paginated. Categories indicate whether new topics are locked. Each topic returns up to eight tags.

`forumSpaces(first:, offset:)` lists active Spaces. `forumSpace(slug:)` provides its description, rules, images, owner, counts, and `viewerMember`. Member, topic, and message counts reflect current visibility. Owners and moderators receive no access exceptions through this API. Managing Spaces, assigning roles, and moderation are outside the public contract.

## Create, reply, and edit

```graphql
mutation NewTopic($category: ID!, $tags: [ID!]!) {
  createForumTopic(input: {
    categoryId: $category
    title: "What are you watching?"
    body: "Share your recommendations for this season."
    tagIds: $tags
  }) { id title }
}
```

`createForumTopic` requires a 4–160 character title and a 2–20000 character body after trimming whitespace. Supply up to eight distinct existing tag IDs. The topic, initial message, tags, author subscription, and notifications are committed together; invalid tags leave no partial topic. Public topic creation does not move topics into Spaces.

```graphql
mutation Reply($topic: ID!, $parent: ID) {
  createForumPost(topicId: $topic, parentId: $parent, body: "My recommendation!") {
    id topicId parentId body viewerOwns
  }
}
```

`createForumPost` accepts a 2–20000 character body and subscribes its author to the topic. Optional `parentId` must identify an active, accessible message in the same topic.

`updateForumPost(id:, body:, reason:)` changes only an active message owned by the token user. Optional reason: up to 300 characters. The service records a revision without exposing its history through the public API. Closed topics and muted participants cannot publish, edit, or react.

`deleteForumPost(id:)` removes only the token owner's message. It returns `false` when nothing was removed, including repeated deletion, and preserves discussion structure with an empty body. `setForumTopicTags(id:, tagIds:)` replaces the tags of a topic owned by the token user; an empty list clears them.

## Reactions, subscriptions, and membership

```graphql
mutation Interact($topic: ID!, $post: ID!, $space: ID!) {
  setForumSubscription(id: $topic, enabled: true)
  setForumReaction(id: $post, reaction: HELPFUL, enabled: true)
  setForumMembership(spaceId: $space, enabled: true)
}
```

`set*` operations accept a desired state: repeating `enabled: true` preserves that state. Each mutation field has its own transaction; the example is not atomic across fields. Reactions are `LIKE`, `HELPFUL`, `AGREE`, and `INSIGHTFUL`. You cannot react to your own message. `reactions` provides counts and `viewerReacted` per type.

`viewer.forumSubscriptions(first:, offset:)` requires `forum:read` and lists subscribed topics that remain accessible. Subscribing does not grant access to private or archived content.

Space membership uses the ordinary `MEMBER` role. The API does not remove owners/moderators or allow leaving during an active mute to bypass restrictions. Leaving and rejoining does not restore moderation privileges.

## Notifications and reports

`viewer.notifications` still requires `notifications:read`. Forum references `forumTopicId`, `forumPostId`, and previews also require `forum:read`, an enabled forum, and currently accessible content. Removal, archiving, blocks, or visibility changes can make these fields null. This contract does not provide GraphQL subscriptions or push delivery.

`reportContent` also accepts `FORUM_TOPIC` and `FORUM_POST` with `reports:write`, enforcing the same visibility rules. It does not require `forum:write`; reporting your own content is forbidden. It returns a receipt without moderation data. See [report limits](community.md).

## Privacy, limits, and recovery

Archived topics/Spaces, inactive/deleted accounts, and blocks in either direction are excluded. `FOLLOWERS` profiles require following the author; `PRIVATE` profiles are accessible only to their owner. These rules apply before pagination and to searched message bodies. Messages from inaccessible authors are excluded, and parent references are revalidated. Administrator tokens remain limited to the public contract.

Pagination: `first` 1–100, `offset` 0–10000, defaults 20/0. [GraphQL cost and error limits](graphql.md) apply. Per account: 10 new topics/hour, 60 replies/hour, 60 edits/hour, 60 deletions/hour, 60 tag replacements/hour, and 120 interactions/hour. Verified email may be required. Disabling the forum blocks this surface.

Inspect `errors` even with HTTP 200. After a topic/reply creation timeout, check the current state before retrying: creation has no idempotency key. Render BBCode with a renderer that sanitizes content and links. Do not treat message bodies as trusted HTML.
