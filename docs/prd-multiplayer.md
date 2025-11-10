# Multiplayer Number Guess Game PRD (EN/JA)
# マルチプレイヤー数当てゲーム PRD（英日併記）

**Author / 作成者:** PM Agent  
**Date / 日付:** 2025-11-10  
**Status / ステータス:** Draft v1.0  
**Repository / リポジトリ:** `bosai-sandbox`

---

## 1. Executive Summary / エグゼクティブサマリー
Transform the single-player browser guessing game into a synchronous multiplayer experience (up to four players) backed by Firebase (Authentication, Firestore/Realtime Database, Cloud Functions) so remote players share real-time state for turns, guesses, and celebrations.  
現行のシングルプレイヤー向けブラウザゲームをFirebase（認証、Firestore／Realtime Database、Cloud Functions）で支えられた最大4人同時の同期型マルチプレイへ拡張し、遠隔プレイヤー同士でターン・推測・祝福演出をリアルタイム共有できるようにする。

---

## 2. Goals & Objectives / 目標と目的
- Support 2–4 players in a shared lobby with sequential turns.  
  2〜4人が同じロビーで順番にターンを回せるようにする。  
- Preserve the playful UI (confetti, dancing stickman) in a multiplayer context.  
  紙吹雪やダンシング棒人間など既存の楽しい演出をマルチプレイ仕様に適合させる。  
- Provide low-latency synchronized updates across all clients via Firebase real-time sync.  
  Firebaseのリアルタイム同期を活用し、低遅延で各クライアントに状態更新を届ける。  
- Maintain responsive, accessible, friendly UX on desktop and mobile.  
  デスクトップ・モバイルを問わずレスポンシブで親しみやすいUXを実現する。

---

## 3. Success Metrics / 成功指標
- State updates reach all players within 250 ms (LAN) / 1 s (WAN).  
  状態更新がLANでは250ms以内、WANでは1秒以内に全員へ届く。  
- Active player highlighting is consistent across clients.  
  手番プレイヤーのハイライト表示が全クライアントで一致する。  
- Game restarts without page reload.  
  ページを再読み込みせずにゲームを再開できる。  
- Compatible with modern Chrome/Safari/Firefox on desktop & mobile.  
  最新のChrome/Safari/Firefox（PC・モバイル）で動作する。

---

## 4. Users & Personas / ユーザーとペルソナ
- **Casual Players / カジュアルプレイヤー:** Friends and family seeking quick cooperative fun.  
  気軽に一緒に遊びたい友人・家族を想定。  
- **Facilitator / ホスト役:** Player who creates the lobby and coordinates participants.  
  ロビーを作成し参加者を招待するホスト役。

---

## 5. Scope / スコープ

### 5.1 In Scope / 対象範囲
1. Lobby creation and join flow (player name + code/link).  
   プレイヤー名とコード／リンクによるロビー作成・参加フロー。  
2. Turn management for up to four players, including answer generation executed securely in Cloud Functions.  
   最大4人までのターン管理とCloud Functions上で安全に実行される正解数値の生成。  
3. Real-time broadcast of guesses, results, and celebratory effects through Firestore/Realtime Database listeners.  
   Firestore／Realtime Databaseのリスナーを通じて推測・結果・祝福演出をリアルタイム共有。  
4. Round restart without reloading the page while retaining players, driven by shared Firebase state.  
   Firebase共有状態を用い、ページ再読み込みなしで同じメンバーによるラウンド再開。  
5. Local storage of best scores per device plus optional sync to user profiles.  
   端末ごとのベストスコア保存と、必要に応じたユーザープロフィールへの同期。  
6. Optional quick reactions (cheer/boo) if time allows (stored as lightweight Firestore documents).  
   余力があればリアクション（歓声／ブーイング）を追加し、軽量なFirestoreドキュメントとして保存。

### 5.2 Out of Scope / 対象外
- Ranked matchmaking, persistent accounts.  
  ランクマッチングやアカウント機能。  
- Spectator-only mode.  
  観戦専用モード。  
- Ads or monetization features.  
  広告や課金機能。

---

## 6. Functional Requirements / 機能要件
1. **Lobby Management / ロビー管理**  
   - Host creates lobby document in Firestore/Realtime Database; generate shareable code/link.  
     ホストがFirestore／Realtime Databaseにロビードキュメントを作成し、共有コード／リンクを生成する。  
   - Display joined players from the lobby document, enforce max four seats, optionally lock when game starts.  
     ロビードキュメントに基づき参加者を表示し、最大4人までに制限、ゲーム開始時にロック可能。  
2. **Gameplay Flow / ゲーム進行**  
   - Cloud Function generates secret number at round start and writes to secured field.  
     ラウンド開始時にCloud Functionsが正解数字を生成し、保護されたフィールドに書き込む。  
   - Only active player (validated via security rules/Function) may submit guesses; others see waiting state.  
     アクティブプレイヤーのみ（セキュリティルール／Functionsで検証）推測を送信でき、他は待機表示。  
   - Broadcast guess + result through database updates; Functions rotate turn index when incorrect.  
     推測結果をデータベース更新で共有し、不正解時はFunctionsがターンを更新。  
   - Correct guess triggers win flag, confetti, stickman dance, disables further input until reset.  
     正解時は勝利フラグを立て、紙吹雪・棒人間ダンスを発動しリセットまで入力を停止。  
   - Host (or vote) can invoke a Function to start a new round without leaving lobby.  
     ホスト（または投票）がFunctionsを呼び出してロビーを維持したまま新ラウンドを開始。  
3. **State & History / 状態と履歴**  
   - Display per-player attempts, wins, and guess log stored in Firestore collections/subcollections.  
     Firestoreのコレクション／サブコレクションに格納された試行回数・勝利数・推測履歴を表示。  
   - History persists until round reset document is updated; highlight current round.  
     ラウンドリセット用ドキュメント更新まで履歴を保持し、現行ラウンドを表示。  
4. **Edge Cases / 例外処理**  
   - Handle disconnects gracefully; Cloud Functions advance turn after configurable timeout stored in the lobby document.  
     切断時はロビードキュメントに保存されたタイムアウト値に基づきCloud Functionsが自動でターンを進める。  
   - Allow rejoin via lobby code if lobby still active; security rules prevent duplicate seats.  
     ロビーが有効であればコードで再参加でき、セキュリティルールにより重複席を防ぐ。  
   - Prevent guess spamming via Firebase security rules and server-side validation.  
     Firebaseセキュリティルールとサーバー側検証で推測スパムを抑制する。

---

## 7. Non-Functional Requirements / 非機能要件
- Real-time sync via Firebase Firestore listeners or Realtime Database subscriptions.  
  Firebase Firestoreのリスナー／Realtime Databaseの購読でリアルタイム同期を実現。  
- Hosting on Firebase Hosting or equivalent CDN-backed static hosting.  
  Firebase HostingまたはCDN対応の静的ホスティングで配信。  
- Ability to support ~100 concurrent lobbies using Firebase’s managed scalability.  
  Firebaseのマネージドスケーラビリティで約100ロビーの同時稼働に対応。  
- Enforce security via Firebase Authentication + Security Rules + Cloud Functions.  
  Firebase Authenticationとセキュリティルール、Cloud Functionsで安全性を確保。  
- Local dev friendly; deployable to Render/Heroku/Fly.  
  ローカルでの開発が容易で、Render/Heroku/Flyへデプロイ可能。  
- Target ~100 concurrent lobbies with minimal tuning.  
  約100ロビーの同時稼働に耐える。  
- Validate inputs server-side; sanitize user text.  
  入力値をサーバー側で検証し、ユーザー文字列をサニタイズ。

---

## 8. Dependencies & Integrations / 依存関係
- Firebase Authentication for player identity (anonymous or nickname-based).  
  プレイヤーID管理としてFirebase Authentication（匿名またはニックネームベース）を使用。  
- Firebase Firestore or Realtime Database for lobby/game state.  
  ロビー／ゲーム状態の保存にFirebase FirestoreまたはRealtime Databaseを利用。  
- Firebase Cloud Functions for authoritative operations (secret generation, turn validation).  
  Cloud Functionsで正解生成やターン検証などの権威的処理を実行。  
- Vanilla JS front-end extended with Firebase Web SDK.  
  Firebase Web SDKを組み込んだプレーンJSフロントエンド。

---

## 9. Risks & Mitigations / リスクと対策
| Risk / リスク | Mitigation / 対策 |
| -------------- | ----------------- |
| Firebase quota limits | Monitor usage, enable Blaze plan alerts early. |
| Firebaseのクォータ制限 | 利用状況を監視し、Blazeプランのアラートを早期設定。 |
| Security rules complexity | Define clear rule sets, use emulator suite for testing. |
| セキュリティルールの複雑さ | ルールを明確化し、エミュレーターでテストする。 |
| UI state drift across clients | Derive state exclusively from Firebase listeners. |
| クライアント間の状態ずれ | Firebaseリスナーからの状態のみでUIを更新。 |
| Disconnect handling | Implement timeout + reconnection tokens. |
| 切断対応 | タイムアウトと再接続トークンを導入。 |
| Mobile performance / animations | Respect `prefers-reduced-motion`, throttle confetti. |
| モバイル性能・演出負荷 | `prefers-reduced-motion`を尊重し演出を調整。 |

---

## 10. Rollout Plan / ロールアウト計画
1. Firebase project setup (Authentication, Firestore/Realtime Database, Hosting).  
   Firebaseプロジェクトを構築し、Authentication・Firestore／Realtime Database・Hostingを設定する。  
2. Implement Cloud Functions for lobby lifecycle (create/start/reset) and guess validation.  
   ロビーライフサイクル（作成／開始／リセット）と推測検証を行うCloud Functionsを実装する。  
3. Front-end lobby UI integration with Firebase Web SDK (Auth + database listeners).  
   フロントエンドでFirebase Web SDK（Auth＋データベースリスナー）を用いてロビーUIを統合。  
4. Configure security rules, run emulator-based QA (multi-tab/device, offline scenarios).  
   セキュリティルールを設定し、エミュレーターで複数タブ／デバイスやオフラインシナリオのQAを実施。  
5. Deploy to Firebase Hosting and update documentation (`docs/`, README).  
   Firebase Hostingへデプロイし、ドキュメント（`docs/`やREADME）を更新する。

---

## 11. Open Questions / 未決事項
1. Turn timer enforced via Cloud Functions? Default duration?  
   Cloud Functionsでターンタイマーを強制するか？標準時間は？  
2. Host leaves—auto-promote next player or dissolve lobby within Firebase rules?  
   Firebase上でホスト離脱時に次プレイヤーを昇格させるか、ロビーを解散するか？  
3. Allow spectators or keep player-only? How to represent spectators in data model?  
   観戦モードを許可するか、データモデルでどう表現するか？  
4. Persist lobby after inactivity? How to clean stale documents with Cloud Functions?  
   非アクティブ時でもロビーを残すか？Cloud Functionsでどのように古いドキュメントを削除するか？

---

## 12. Appendices / 付録
- Existing single-player game assets remain the base for UI styling.  
  既存のシングルプレイ資産をUIの基礎として活用。  
- Future features (bots, ranking) intentionally omitted; Firebase architecture can extend later.  
  将来的なボットやランキング機能はスコープ外だが、Firebaseアーキテクチャで拡張可能。
