# Multiplayer Upgrade Architecture Blueprint (EN/JA)
# マルチプレイヤー拡張アーキテクチャ設計書（英日併記）

**Author / 作成者:** Architect Agent  
**Date / 日付:** 2025-11-10  
**Status / ステータス:** Draft v1.0

---

## 1. Context / 背景
The current project is a single-player browser number-guessing game with no backend. To support multiplayer (up to four players taking turns), we adopt Firebase services (Authentication, Firestore/Realtime Database, Cloud Functions, Hosting) to persist lobby state and broadcast real-time events.  
本プロジェクトはバックエンドを持たないシングルプレイヤー向け数当てゲームである。最大4人のターン制マルチプレイ実現のため、Firebase（認証、Firestore／Realtime Database、Cloud Functions、Hosting）を採用し、ロビー状態の保持とリアルタイムイベント配信を行う。

---

## 2. Solution Overview / ソリューション概要
- Use Firebase Authentication for lightweight player identity and session management.  
  Firebase Authenticationでプレイヤーのアイデンティティとセッション管理を行う。  
- Store lobby, turn, and guess state in Firestore (or Realtime Database) leveraging real-time listeners.  
  Firestore（またはRealtime Database）にロビー・ターン・推測状態を保存し、リアルタイムリスナーを活用する。  
- Implement Firebase Cloud Functions for authoritative operations: lobby creation, secret number generation, guess validation, turn rotation, cleanup.  
  Firebase Cloud Functionsでロビー作成、正解生成、推測検証、ターン更新、クリーンアップなどの権威的処理を実行する。  
- Extend the existing front-end (vanilla JS) with Firebase Web SDK to subscribe to state changes and invoke callable functions.  
  既存のプレーンJSフロントエンドにFirebase Web SDKを組み込み、状態変更の購読とCallable Functionの呼び出しを行う。

---

## 3. High-Level Architecture / ハイレベル構成
```
Browser (Vanilla JS + Firebase SDK)
  ├─ Lobby Modal, Player List, Turn UI, Celebration Effects
  └─ Firebase Clients (Auth, Firestore listeners, callable Functions)
             ⇵ HTTPS/WSS (managed by Firebase)
Firebase Services
  ├─ Authentication (anonymous or nickname sign-in)
  ├─ Firestore / Realtime Database (lobby + game documents)
  ├─ Cloud Functions (create/join/reset lobby, guess validation, cleanup)
  └─ Hosting (serve front-end assets)
```
ブラウザ（Firebase SDKを組み込んだプレーンJS SPA）がFirebase認証とFirestoreリスナーを利用し、Cloud Functions経由でビジネスロジックを実行する構成。

---

## 4. Backend Components / バックエンド構成
| Component / コンポーネント | Responsibility / 役割 |
| ------------------------- | --------------------- |
| Firebase Authentication | Manage player sessions (anonymous or nickname-based). / プレイヤーのセッション管理（匿名またはニックネーム） |
| Firestore (or Realtime Database) | Store lobby document, player roster, turn index, guess history. / ロビードキュメント、プレイヤー一覧、ターン、履歴を保存 |
| Cloud Functions (HTTPS / Callable) | Authoritative operations: create/join lobby, generate secret number, validate guesses, rotate turns, reset games. / ロビー作成・参加、正解生成、推測検証、ターン更新、リセットを担う権威的処理 |
| Cloud Functions (Scheduled) | Cleanup stale lobbies, enforce inactivity timeouts. / 古いロビーの削除や非アクティブ監視 |
| Firebase Hosting | Serve static front-end assets over HTTPS. / フロントエンド静的資産をHTTPSで配信 |
| Firebase Emulator Suite | Local development/testing for Auth, Firestore, Functions. / Auth・Firestore・Functionsのローカル開発用エミュレーター |

- Firestore schema example: `lobbies/{lobbyId}` document with subcollections `players`, `guesses`, and fields `secretHash`, `turnIndex`, `status`.  
  Firestoreのスキーマ例：`lobbies/{lobbyId}`ドキュメントにサブコレクション`players`・`guesses`、フィールド`secretHash`・`turnIndex`・`status`などを保持。  
- Secret number stored hashed/salted; actual value kept in Cloud Functions memory to avoid exposure.  
  正解数はハッシュ化して保存し、実値はCloud Functions内に保持（露出防止）。  
- Security rules restrict write access: only active player can create `guess` entry; host-only actions require custom claims or lobby role field.  
  セキュリティルールで書き込みを制限し、手番プレイヤーのみ`guess`を書き込め、ホスト操作にはカスタムクレームまたはロールフィールドが必要。

---

## 5. Front-end Structure / フロントエンド構成
| File / ファイル | Updates / 変更点 |
| --------------- | ---------------- |
| `web/index.html` | Add lobby modal, player list, active player highlight, host controls. / ロビーモーダル・プレイヤー一覧・手番ハイライト・ホスト用操作を追加 |
| `web/script.js` | Implement client state store with Firebase SDK, register Firestore listeners, call Cloud Functions. / Firebase SDKによる状態管理、Firestoreリスナー登録、Cloud Functions呼び出しを実装 |
| `web/styles.css` | Style lobby/game panels, responsive layout, disabled states, notifications. / ロビーとゲームパネルのスタイル、レスポンシブ対応、無効化状態、通知表示を追加 |

Front-end flow / フロントエンドの流れ:
1. Display lobby modal → call Cloud Function (`createLobby` or `joinLobby`) via Firebase SDK.  
   ロビーモーダルでFirebase SDK経由のCloud Function（`createLobby`／`joinLobby`）を呼び出す。  
2. On success, subscribe to Firestore document/collection snapshots for lobby + players.  
   成功後、ロビーとプレイヤーのFirestoreドキュメント／コレクションにスナップショットリスナーを登録。  
3. Render UI based on snapshots (turn player, guesses, status).  
   スナップショットに基づきUIを描画（手番、推測、状態など）。  
4. Active player uses callable Function `submitGuess` which validates and writes results.  
   手番プレイヤーはCallable Function `submitGuess`を呼び出し、検証・結果書き込みを行う。  
5. Firestore listeners pick up updated state (`guessResult`, `turnIndex`, `winFlag`) and update UI.  
   Firestoreリスナーが更新を拾い、UIに`guessResult`や`turnIndex`、`winFlag`を反映する。  
6. Host triggers `startNextRound` Function to reset fields while preserving lobby membership.  
   ホストは`startNextRound`関数を呼び、ロビー構成を維持したままフィールドをリセットする。

---

## 6. Event Protocol / イベントプロトコル

### Firebase Callable Functions (Client → Server) / Firebase呼び出し可能関数（クライアント→サーバー）
```json
// createLobby
{ "lobbyName": "NightOwls", "displayName": "Alice" }

// joinLobby
{ "lobbyCode": "ABCD", "displayName": "Bob" }

// submitGuess
{ "lobbyId": "abcd1234", "guess": 17 }

// startNextRound
{ "lobbyId": "abcd1234" }
```
- Functions verify Firebase Auth UID, lobby membership, and turn ownership.  
  FunctionsがAuth UIDやロビー参加状況、手番を検証する。  
- Optional `leaveLobby`, `sendReaction` functions for future extension.  
  将来的には`leaveLobby`や`sendReaction`なども拡張可能。

### Firestore Snapshot Payloads (Server → Clients) / Firestoreスナップショット（サーバー→クライアント）
```json
// lobbies/{lobbyId}
{
  "status": "in-progress",
  "turnIndex": 2,
  "round": 1,
  "winFlag": false,
  "hostUid": "...",
  "createdAt": "2025-11-10T11:32:00Z"
}

// lobbies/{lobbyId}/players/{playerId}
{
  "displayName": "Alice",
  "order": 0,
  "uid": "...",
  "attempts": 3,
  "wins": 1
}

// lobbies/{lobbyId}/guesses/{guessId}
{
  "playerId": "...",
  "value": 15,
  "result": "high",
  "createdAt": "..."
}
```
- Clients subscribe to lobby document, players subcollection, latest guesses.  
  クライアントはロビードキュメント、プレイヤーサブコレクション、最新の推測に購読する。  
- Cloud Functions update `winFlag`, `turnIndex`, attempt counters, ensuring consistent state.  
  Cloud Functionsが`winFlag`や`turnIndex`、試行カウンタを更新し、一貫性を保つ。

---

## 7. Turn & Game Logic / ターンとゲームロジック
- Cloud Functions act as controller: keep secret number in memory or hashed doc field.  
  Cloud Functionsがコントローラとして動作し、正解数字は関数内メモリまたはハッシュ化フィールドで保持。  
- When `submitGuess` called: Function verifies player is active, compares guess, writes result doc, updates attempts and `turnIndex`.  
  `submitGuess`呼び出し時、手番確認後に推測を判定し、結果ドキュメントと試行数、`turnIndex`を更新。  
- On correct guess: Function updates `winFlag`, `winnerPlayerId`, `finishedAt`, and prevents further guesses until `startNextRound`.  
  正解時は`winFlag`・`winnerPlayerId`・`finishedAt`をセットし、`startNextRound`まで推測を禁止。  
- `startNextRound` reinitializes `secretHash`, resets attempts/guesses subcollection, increments round counter.  
  `startNextRound`が`secretHash`を再生成し、試行／推測サブコレクションをリセット、ラウンド番号を増やす。  
- Optional scheduled Function monitors `updatedAt` to auto-advance or close inactive lobbies.  
  任意でスケジュール実行するFunctionが`updatedAt`を監視し、非アクティブロビーの自動進行・終了を行う。

Optional / 任意: implement turn timeout (e.g., 30 seconds) with auto-advance and notify clients.  
ターンタイムアウト（例：30秒）を実装し、自動で次プレイヤーに進む運用も検討。

---

## 8. State Storage / 状態ストレージ
- Firestore stores lobby documents; data is automatically replicated and persisted.  
  Firestoreがロビーデータを永続化・複製する。  
- Turn index, attempts, guesses stored as primitive fields and subcollections for transactional updates.  
  ターン番号や試行回数、推測履歴はフィールドとサブコレクションで管理し、トランザクション更新を行う。  
- Use transactions / batched writes in Cloud Functions to prevent race conditions.  
  Cloud Functionsでトランザクション／バッチ書き込みを利用し、競合を防ぐ。  
- Scheduled Functions delete lobbies after inactivity threshold to control costs.  
  非アクティブ状態が閾値を超えたロビーはスケジュールFunctionで削除し、コストを管理。

---

## 9. Security & Validation / セキュリティとバリデーション
- Generate lobby codes using Cloud Functions with collision checks in Firestore.  
  Cloud Functionsで重複チェックを行いながらロビーコードを生成。  
- Firebase Auth ensures each request has verified `uid`; assign lobby role in document.  
  Firebase Authで各リクエストの`uid`を検証し、ロビードキュメントにロールを割当て。  
- Security Rules restrict writes: only active player can add `guesses`, host-only endpoints callable by host UID.  
  セキュリティルールで書き込みを制限し、手番プレイヤーのみ`guesses`に追加でき、ホスト専用操作はホストUIDのみがCallable。  
- Cloud Functions validate payloads, reject malformed input, sanitize display names.  
  Cloud Functionsでペイロードを検証し、不正な入力を拒否、表示名をサニタイズ。

---

## 10. Observability / 可観測性
- Use Firebase Logging (Cloud Logging) to capture Function invocations, errors, and custom metrics.  
  Firebase（Cloud Logging）でFunction呼び出し、エラー、カスタムメトリクスを記録。  
- Firestore documents track activity timestamps; scheduled Functions can emit metrics.  
  Firestoreドキュメントでアクティビティ時刻を管理し、スケジュールFunctionでメトリクスを出力。  
- Integrate Firebase Crashlytics or Google Analytics for front-end event tracking (optional).  
  必要に応じてFirebase CrashlyticsやGoogle Analyticsでフロントエンドのイベントを追跡。

---

## 11. Testing Strategy / テスト戦略
- **Cloud Functions:** Use Firebase Emulator Suite + Jest/TypeScript tests to validate callable logic and security rules.  
  Cloud FunctionsはFirebase Emulator SuiteとJest／TypeScriptテストでロジックとセキュリティルールを検証。  
- **Front-end:** multi-tab manual tests, Playwright/Cypress automation with emulators.  
  フロントエンドはエミュレーターを用いた複数タブ手動テストとPlaywright/Cypress自動化。  
- Simulate network jitter, disconnect/reconnect sequences.  
  ネットワーク遅延や切断→再接続シナリオを検証。

---

## 12. Deployment / デプロイ
- **Local:** Use Firebase Emulator Suite (Auth, Firestore, Functions, Hosting) for offline development.  
  ローカル開発ではFirebase Emulator Suite（Auth、Firestore、Functions、Hosting）を活用する。  
- **Production:** Deploy front-end to Firebase Hosting, deploy Functions via `firebase deploy`.  
  本番ではフロントエンドをFirebase Hostingに、Functionsを`firebase deploy`でデプロイする。  
- Configure environment variables/secrets (API keys, salts) using Firebase Functions runtime config.  
  APIキーやソルトはFirebase Functionsのruntime configで管理する。  
- Set up custom domain + HTTPS certificate through Firebase Hosting if desired.  
  必要に応じてFirebase HostingでカスタムドメインとHTTPS証明書を設定。

---

## 13. Risks & Mitigations / リスクと対策
| Risk / リスク | Mitigation / 対策 |
| ------------- | ----------------- |
| Host disconnects mid-game | Define policy in Cloud Functions (auto-promote or close) and reflect via rules. / Cloud Functionsでホスト離脱時の方針（昇格か終了か）を実装し、ルールに反映 |
| Firestore costs/quota | Prune history, use batched writes, monitor usage in console. / 履歴を適宜削除し、バッチ書き込みでコスト最適化、コンソールで利用状況を監視 |
| Security misconfiguration | Use security rule unit tests & emulator to validate scenarios. / セキュリティルールの単体テストとエミュレーターで検証 |
| Client desync | Drive UI exclusively from snapshot listeners; avoid local-only state. / UIはスナップショットリスナーからのみ更新し、ローカルのみの状態を避ける |
| Animation overload on low-end devices | Respect `prefers-reduced-motion`, throttle confetti based on device metrics. / `prefers-reduced-motion`に従い、端末に応じて紙吹雪量を調整 |

---

## 14. Next Steps / 今後のステップ
1. Clarify Firebase-specific open questions (timer enforcement, host privileges, spectator support).  
   Firebase特有の未決事項（タイマー、ホスト権限、観戦機能）を整理する。  
2. Initialize Firebase project, configure Authentication providers, create Firestore structure.  
   Firebaseプロジェクトを初期化し、認証プロバイダ設定とFirestore構造を作成する。  
3. Implement Cloud Functions (`createLobby`, `joinLobby`, `submitGuess`, `startNextRound`, cleanup).  
   Cloud Functions（`createLobby`、`joinLobby`、`submitGuess`、`startNextRound`、クリーンアップ）を実装する。  
4. Integrate Firebase SDK into front-end, build lobby UI, subscribe to snapshots.  
   Firebase SDKをフロントエンドに統合し、ロビーUIを構築、スナップショット購読を実装する。  
5. Test via Emulator Suite & multi-device scenarios, then deploy to Firebase Hosting.  
   Emulator Suiteとマルチデバイスシナリオでテストし、Firebase Hostingへデプロイする。
