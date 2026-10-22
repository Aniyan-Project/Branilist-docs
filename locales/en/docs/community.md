# Community, reviews and notifications

[Forum and Spaces](forum.md)
[Index](README.md) · [GraphQL](graphql.md) · [Mobile applications](mobile-apps.md) · [OAuth and PKCE](authentication.md)

Community operations use `POST https://branilist.com/api/graphql` with an OAuth Bearer token. API keys and website cookies cannot authorize them. Every write acts as the token owner; there is no argument to impersonate another account.

## Permissions

| Scope | Access |
| --- | --- |
| `social:read` | Accessible feeds, followers, posts, reviews and comments, including private profile messages when the token owner is an authorized participant |
| `social:write` | Follow, publish, edit/delete personal posts, react and remove personal feed events |
| `reviews:write` | Create, replace and delete your review of a work |
| `comments:write` | Publish, reply and delete your comments |
| `notifications:read` | Personal notifications, unread count and settings |
| `notifications:write` | Mark notifications read and change settings |
| `blocks:read` | Read personal blocked/muted accounts |
| `blocks:write` | Block/unblock and mute/unmute |
| `reports:write` | Report accessible content |

Enable required scopes in the application's settings and obtain new consent. Existing applications/tokens do not gain new permissions automatically. Read scopes do not imply write access; API keys remain catalog-only.

## Feed and connections

```graphql
query CommunityHome {
  viewer {
    feed(scope: FOLLOWING, types: [PROFILE_POST, REVIEW, MEDIA_LIST], first: 20) {
      nodes {
        id type actor { id username displayName avatarUrl }
        post { id body visibility }
        review { id title recommendation spoilerLevel }
        media { id title { romaji } }
        status progress likeCount viewerLiked createdAt
      }
      pageInfo { hasNextPage offset limit }
    }
    followers(first: 20) { nodes { id username } pageInfo { hasNextPage } }
    following(first: 20) { nodes { id username } pageInfo { hasNextPage } }
  }
}
```

`viewer.feed` requires `social:read`. Its default `FOLLOWING` scope includes your account; `GLOBAL` considers the accessible community. Types are MEDIA_LIST, REVIEW, FOLLOW, PROFILE_POST and REPOST. An empty type list includes all. Results sort by newest activity, then ID.

Profile, activity and list visibility, active-account status, blocks, mutes and adult-content preferences are applied before pagination. Events for currently private library entries are hidden from other accounts. Private messages and profile-directed messages never enter global/following feeds.

`user(id: or username:)` also exposes `followers`, `following`, `posts` and `reviews`. The parent requires `profile:read`; these fields require `social:read`. Public-user restrictions remain: `user.posts` includes PUBLIC posts only and requires PUBLIC activity. Use the feed, `viewer.posts` and direct social-resource lookups for personal/follower-visible content. `SocialActor` summaries never expose email, credentials or administrative permissions.

```graphql
mutation Follow($username: String!) {
  setFollow(username: $username, enabled: true)
}
```

`setFollow`, `setBlock` and `setMute` take a username and desired state. Repeating that state preserves it. Their boolean is the final state: `false` after unfollowing is a successful unfollow.

## Posts, replies and quotes

```graphql
mutation Publish {
  createPost(input: {body: "My Branilist post"}) { id body visibility createdAt }
}
```

- `createPost(input:)` accepts 1–12000 body characters and up to 4 existing POST_IMAGE asset IDs owned by your account.
- `updatePost(id:, body:)` replaces only the text of your post, preserving images and context.
- `deletePost(id:)` deletes your post and its replies according to website rules.
- `post(id:)` reads an accessible post, including `replies(first:, offset:)` and `quotedPost`.
- `viewer.posts` lists your root posts and profile messages addressed to you, subject to current blocks.

For replies, set `parentId` to the root post. Replies have one conversation level and inherit the root's visibility. For quotes, set `quotedPostId`; only public root posts without a profile recipient may be quoted. A reply cannot also be a quote.

For a profile message, set another account's `recipientId` and PRIVATE or PUBLIC visibility. Private messages are visible only to authorized sender/recipient accounts, and replies inherit that protection. Website administrator roles never bypass public-API checks. A directed message cannot also be a reply/quote; ordinary posts without recipients use PUBLIC.

Bodies are text/BBCode, not ready-to-inject HTML. Render and sanitize them in the client. This endpoint does not upload files; attached asset IDs must already exist and belong to the authorized account.

## Reviews

```graphql
mutation Review($mediaId: ID!) {
  saveReview(input: {
    mediaId: $mediaId
    title: "My opinion"
    body: "A review with sufficient detail about the selected work."
    recommendation: RECOMMENDED
    spoilerLevel: NONE
    aspects: {story: 8, enjoyment: 9}
  }) { id title body recommendation aspects { story enjoyment } }
}
```

`saveReview` requires `reviews:write` and creates/replaces the token owner's review for an internal Branilist media ID. Body: 20–10000 characters; optional title: up to 120. Recommendations: RECOMMENDED, MIXED, NOT_RECOMMENDED. Spoilers: NONE, MINOR, MAJOR. Optional story, characters, visuals, sound and enjoyment aspect scores use integers 1–10.

The input replaces the review: omitted title/aspects are cleared. Concurrent creation retries do not produce duplicate review feed events. Reviews do not change library rating or progress.

Read `review(id:)`, `reviews(mediaId:, first:, offset:)`, `user.reviews` or `viewer.myReview(mediaId:)` with `social:read`. `deleteReview(id:)` requires `reviews:write` and only removes your review.

## Comments and reactions

`comments(mediaId: or reviewId: or activityId:)` requires exactly one discussion selector and `social:read`. `createComment` requires `comments:write`, the same selector and 1–4000 body characters. Add `parentId` to reply to an accessible comment in that discussion. Replies to replies are attached to the root comment. `deleteComment` only removes your comments. Removed comments may appear as empty records with `removed: true` to preserve the conversation.

```graphql
mutation Comment($reviewId: ID!) {
  createComment(input: {reviewId: $reviewId, body: "My comment on the review"}) {
    id body parentId createdAt
  }
}
```

`setPostLike`, `setPostRepost`, `setActivityLike`, `setReviewLike` and `setCommentLike` require `social:write`, the resource ID and `enabled`. `setReviewReaction` also takes HELPFUL, INSIGHTFUL or WELL_WRITTEN as `reaction`. These assign state rather than toggling it. Website restrictions still apply, including blocks and prohibitions on liking/reposting your own post. Private messages cannot be reposted.

`deleteActivity(id:)` only removes a feed event owned by the token owner. It does not delete the library entry, review or original post, or automatically undo a reaction.

## Personal notifications

```graphql
query Notifications {
  viewer {
    unreadNotificationCount
    notifications(first: 20) {
      nodes { id type preview priority readAt createdAt postId reviewId commentId }
      pageInfo { hasNextPage }
    }
    notificationPreferences { follows replies emailMode quietHoursEnabled quietTimezone }
    notificationTypePreferences { type inAppEnabled emailEnabled mutedUntil }
  }
}
```

These fields require `notifications:read`. Content references and previews are revalidated against current access and may be `null` after removal, privacy changes or when authorization cannot be confirmed. Historical previews never bypass privacy. Unread totals can include notifications whose previews are hidden.

`markNotificationRead(id:)` and `markAllNotificationsRead` require `notifications:write`. The former returns true for your notification, even if already read, and false for another account's ID. The latter returns how many previously unread items were marked.

`saveNotificationPreferences` replaces general settings: enabled categories, OFF/IMMEDIATE/DAILY email, grouping, important-only default, indicator and quiet hours. Times use minutes 0–1439 in an IANA timezone such as America/Sao_Paulo. All input fields are required.

`saveNotificationTypePreference` replaces one supported type's settings. Discover identifiers through `viewer.notificationTypePreferences`; send inAppEnabled, emailEnabled and optional mutedUntil. Omitted/null mutedUntil clears temporary muting; past dates are normalized by the server. These operations manage account settings and cannot send arbitrary notifications.

## Blocking and reports

Paginated `viewer.blockedUsers`/`viewer.mutedUsers` require `blocks:read`; `setBlock`/`setMute` require `blocks:write`. Blocking removes follow relationships, mutes and notifications between the accounts according to website behavior. Unblocking does not restore them. Muting filters the feed rather than forbidding direct access to public content.

```graphql
mutation Report($postId: ID!) {
  reportContent(input: {targetType: PROFILE_POST, targetId: $postId, reason: "SPAM"}) {
    id status createdAt
  }
}
```

`reportContent` requires `reports:write` and accepts USER, REVIEW, COMMENT, PROFILE_POST, FORUM_TOPIC or FORUM_POST. The target must be accessible and cannot be your own content. Reason: 3–120 characters; optional details: up to 2000. Known categories such as SPAM are normalized. Duplicate open reports are rejected. The result is only a creation receipt: it never exposes moderation previews, other reporters or moderator notes.

## Limits and recovery

Existing [GraphQL limits](graphql.md) apply, with pages of 1–100 and offset up to 10000. Additional account limits include 20 post creations/edits per 10 minutes, 10 reviews per 10 minutes, 30 comments per 5 minutes, and 10 reports per hour with a 20-per-24-hours ceiling. Reactions, settings and deletions have additional limits. The platform may require email verification for community interaction or disable reports.

Inspect `errors` even on HTTP 200. Administrative roles do not permit changing another account's content. Do not automatically retry post/comment/report creation after a timeout; confirm state first. `set*` mutations preserve the requested state, but multiple mutation fields do not form one transaction. Notifications are read through paginated queries; this contract does not provide subscriptions or mobile push.
