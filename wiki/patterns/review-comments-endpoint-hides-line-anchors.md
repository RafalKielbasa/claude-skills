# review-comments-endpoint-hides-line-anchors

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
After a review with multi-line inline comments is posted, `gh api
repos/<o>/<r>/pulls/<n>/reviews/<id>/comments` returns the comments with `original_start_line` and
`original_line` as `null`, which reads as comments that lost their anchors. `pulls/<n>/comments`
returns the same ids with the correct ranges.

## Przyczyna źródłowa
The review-scoped endpoint returns a reduced comment object without the line fields; the PR-scoped
endpoint returns the full one. Both list the same comment ids, so the difference looks like a failed
anchor instead of a different response shape, and verification costs an extra call each time.

## Dowody
- 2026-10-12, sesja 41420c90-30dc-4fb8-a253-35e0054ade7a (saas app): review 5493597602 on PR #199 —
  the review endpoint showed `line=null`; `pulls/199/comments` showed 84-95, 156-168, 13-14.
- Same session: review 5494000452 on PR #200 — `null-null` for all 7 comments from the review
  endpoint; `pulls/200/comments` filtered by `pull_request_review_id` showed 82-86, 3-5, 18-22,
  195-227, 512-532, 339-342, 240-246, matching the payload.

## Rozwiązanie
In `send` verification read `gh api repos/<o>/<r>/pulls/<n>/comments --paginate` filtered by
`pull_request_review_id == <id>` and compare `original_start_line`/`original_line` with the payload.
Never conclude from the review-scoped endpoint that a comment is unanchored.
