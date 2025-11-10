# Multiplayer Number Guess Game PRD (EN/JA)
# マルチプレイヤー数当てゲーム PRD（英日併記）

**Author / 作成者:** PM Agent  
**Date / 日付:** 2025-11-10  
**Status / ステータス:** Draft v1.0  
**Repository / リポジトリ:** `bosai-sandbox`

---

## 1. Executive Summary / エグゼクティブサマリー
Transform the single-player browser guessing game into a synchronous multiplayer experience (up to four players) with shared real-time state for turns, guesses, and celebrations.  
現行のシングルプレイヤー向けブラウザゲームを最大4人同時の同期型マルチプレイに拡張し、ターン・推測・祝福演出をリアルタイムで共有できるようにする。

---

## 2. Goals & Objectives / 目標と目的
- Support 2–4 players in a shared lobby with sequential turns.  
  2〜4人が同じロビーで順番にターンを回せるようにする。  
- Preserve the playful UI (confetti, dancing stickman) in a multiplayer context.  
  紙吹雪やダンシング棒人間など既存の楽しい演出をマルチプレイ仕様に適合させる。  
- Provide low-latency synchronized updates across all clients.  
  低遅延で各クライアントに状態更新を同期させる。  
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
2. Turn management for up to four players, including answer generation.  
   最大4人までのターン管理と正解数値の生成。  
3. Real-time broadcast of guesses, results, and celebratory effects.  
   推測・結果・祝福演出のリアルタイム共有。  
4. Round restart without reloading the page while retaining players.  
   ページ再読み込みなしで同じメンバーによるラウンド再開。  
5. Local storage of best scores per device.  
   端末ごとのベストスコアをローカル保存。  
6. Optional quick reactions (cheer/boo) if time allows.  
   余力があればリアクション（歓声／ブーイング）を追加。

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
   - Host creates lobby; generate shareable code/link.  
     ホストがロビーを作成し、共有用コード／リンクを生成する。  
   - Display joined players, enforce max four seats, optionally lock when game starts.  
     参加プレイヤーを表示し、最大4人までに制限、ゲーム開始後はロック可能。  
2. **Gameplay Flow / ゲーム進行**  
   - Server generates secret number at round start.  
     ラウンド開始時にサーバーが正解を生成する。  
   - Only active player may submit guesses; others see a waiting state.  
     手番のプレイヤーのみ入力可能、他プレイヤーは待機表示。  
   - Broadcast guess + result, rotate turns when incorrect.  
     推測と結果を共有し、不正解ならターンを進める。  
   - Correct guess triggers win announcement, confetti, stickman dance, disables further input.  
     正解時は勝者通知・紙吹雪・棒人間ダンスを発動し入力受付を停止。  
   - Host (or vote) can start new round without leaving lobby.  
     ホスト（または投票）でロビーを維持したままラウンドを再開可能。  
3. **State & History / 状態と履歴**  
   - Display per-player attempts, wins, and running guess log.  
     プレイヤーごとの試行回数・勝利数・推測履歴を表示。  
   - Maintain history until round reset; highlight current round.  
     ラウンドリセットまで履歴保持、現行ラウンドを識別表示。  
4. **Edge Cases / 例外処理**  
   - Handle disconnects gracefully; auto-advance after configurable timeout.  
     切断時は一定時間後に自動でターンを進める。  
   - Allow rejoin if lobby still active.  
     ロビーが存続していれば再参加を許可。  
   - Prevent guess spamming; server validates turn ownership.  
     推測スパムを防ぎ、サーバー側で手番を検証。

---

## 7. Non-Functional Requirements / 非機能要件
- Real-time transport via WebSocket (FastAPI or equivalent).  
  FastAPI等によるWebSocket通信でリアルタイム同期。  
- Local dev friendly; deployable to Render/Heroku/Fly.  
  ローカルでの開発が容易で、Render/Heroku/Flyへデプロイ可能。  
- Target ~100 concurrent lobbies with minimal tuning.  
  約100ロビーの同時稼働に耐える。  
- Validate inputs server-side; sanitize user text.  
  入力値をサーバー側で検証し、ユーザー文字列をサニタイズ。

---

## 8. Dependencies & Integrations / 依存関係
- Python backend (FastAPI, WebSocket support).  
  Python製バックエンド（FastAPI＋WebSocket対応）。  
- Vanilla JS front-end (existing assets extended).  
  既存のプレーンJSフロントエンドを拡張。  
- Optional: Socket.IO client/server, Redis (for scaling).  
  任意：Socket.IO、Redisなどのスケール向け拡張。

---

## 9. Risks & Mitigations / リスクと対策
| Risk / リスク | Mitigation / 対策 |
| -------------- | ----------------- |
| WebSocket complexity | Follow proven samples; build incrementally. |
| WebSocket実装の複雑さ | 実績あるサンプルに基づき段階的に構築。 |
| UI state drift across clients | Server authoritative updates only. |
| クライアント間の状態ずれ | サーバーを唯一の権威とし通知で同期。 |
| Disconnect handling | Implement timeout + reconnection tokens. |
| 切断対応 | タイムアウトと再接続トークンを導入。 |
| Mobile performance / animations | Respect `prefers-reduced-motion`, throttle confetti. |
| モバイル性能・演出負荷 | `prefers-reduced-motion`を尊重し演出を調整。 |

---

## 10. Rollout Plan / ロールアウト計画
1. Backend scaffold (REST + WebSocket) setup.  
   バックエンド骨組み（REST＋WebSocket）を構築。  
2. Front-end lobby UI and state integration.  
   フロントエンドのロビーUIと状態連携を実装。  
3. Turn logic & real-time broadcasting.  
   ターンロジックとリアルタイム通知を完成。  
4. QA (multi-tab/device), network simulation.  
   複数タブ／デバイスでQA、ネットワーク遅延も検証。  
5. Documentation updates (`docs/`, README).  
   ドキュメント（`docs/`やREADME）を更新。

---

## 11. Open Questions / 未決事項
1. Should we enforce a turn timer? Default duration?  
   ターン制限時間は必要か？標準時間は？  
2. Host leaves—auto-promote next player or dissolve lobby?  
   ホスト離脱時は次のプレイヤーを昇格させるかロビーを解散するか？  
3. Allow spectators or keep strictly player-only?  
   観戦モードを許可すべきか、プレイヤー限定にするか？  
4. Persist lobby after inactivity? For how long?  
   非アクティブ時でもロビーを残すか？残すなら時間は？

---

## 12. Appendices / 付録
- Existing single-player game assets remain the base for UI styling.  
  既存のシングルプレイ資産をUIの基礎として活用。  
- Future features (bots, ranking) intentionally omitted from this scope.  
  今回のスコープからはボットやランキング等を明示的に除外している。
