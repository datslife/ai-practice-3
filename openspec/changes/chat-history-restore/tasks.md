## 1. Backend — Add conversation lookup endpoint

- [x] 1.1 Add `GET /conversations/with/:recipientId` route in `backend/src/conversations/router.ts` — query `conversations` table for a row where `(user_a_id = $userId AND user_b_id = $recipientId) OR (user_a_id = $recipientId AND user_b_id = $userId)`, return `{ id, user_a_id, user_b_id, created_at }` or 404
- [x] 1.2 Add a unit/integration test in `backend/tests/conversations.test.ts` (or equivalent) covering: conversation found (200), no conversation (404), unauthenticated (401)

## 2. Mobile — Fix useChat hook

- [x] 2.1 Change hook signature in `mobile/src/hooks/useChat.ts` from `useChat(conversationId: string | null, currentUserId: string)` to `useChat(recipientId: string, currentUserId: string)`
- [x] 2.2 Add internal `conversationId` state (`useState<string | null>(null)`) and a `useEffect` on mount that calls `GET /conversations/with/:recipientId`, stores the resolved ID, or stays `null` on 404
- [x] 2.3 Fix the messages fetch effect to use the resolved `conversationId` state (already conditional on non-null — no change needed other than sourcing from state instead of param)
- [x] 2.4 Fix response unwrapping in the messages fetch: change `setMessages(data)` to `setMessages(data.messages)` and update the generic type to `apiClient.get<{ messages: Message[] }>`

## 3. Mobile — Update ChatScreen

- [x] 3.1 Update `mobile/src/screens/ChatScreen.tsx` to pass `recipient.id` as the first argument to `useChat` instead of `conversationId` (remove `conversationId` from destructured params if no longer needed)
- [x] 3.2 Confirm `MainStackParamList` `Chat` route params still compile — `conversationId` param can stay in the type or be removed; it is no longer used by the hook

## 4. Verification

- [x] 4.1 Run `cd mobile && npx tsc --noEmit` — zero type errors
- [x] 4.2 Run `cd mobile && npm test` — all unit/hook tests pass
- [ ] 4.3 Manual smoke test on simulator: open chat with existing conversation → history loads; open chat with new user → empty list, send works
