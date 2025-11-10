# Multiplayer Upgrade Architecture Blueprint (EN/JA)
# マルチプレイヤー拡張アーキテクチャ設計書（英日併記）

**Author / 作成者:** Architect Agent  
**Date / 日付:** 2025-11-10  
**Status / ステータス:** Draft v1.0

---

## 1. Context / 背景
The current project is a single-player browser number-guessing game with no backend. To support multiplayer (up to four players taking turns), we introduce a lightweight backend that maintains lobby state and broadcasts real-time events.  
本プロジェクトはバックエンドを持たないシングルプレイヤー向け数当てゲームである。最大4人のターン制マルチプレイを実現するため、ロビー状態を保持しリアルタイムイベントを配信する軽量バックエンドを導入する。

---

## 2. Solution Overview / ソリューション概要
- Add a Python backend using FastAPI with REST endpoints for lobby lifecycle and WebSocket endpoints for real-time updates.  
  ロビー管理用のRESTエンドポイントとリアルタイム更新用WebSocketエンドポイントを備えたFastAPIバックエンドを追加する。  
- Keep game state server-authoritative (players, turns, secret number).  
  プレイヤーリスト・ターン順・正解などのゲーム状態はサーバーが一元管理する。  
- Extend the existing front-end (vanilla JS) to connect via WebSocket, render lobby state, and react to server events.  
  既存のプレーンJSフロントエンドを拡張し、WebSocket接続によってロビー状態を描画しサーバーイベントに応答する。

---

## 3. High-Level Architecture / ハイレベル構成
```
Browser (Vanilla JS SPA)
  ├─ Lobby Modal, Player List, Turn UI, Celebration Effects
  └─ WebSocket Client (State Store, Event Handlers)
             ⇵ WSS
FastAPI Backend
  ├─ REST: POST /lobby, POST /lobby/{id}/join, GET /health
  ├─ WebSocket: /ws/{lobbyId}
  └─ Lobby Manager (in-memory store, turn engine)
```
ブラウザ（プレーンJS SPA）がWebSocketを通じてFastAPIバックエンドと通信し、バックエンドのロビーマネージャーが状態とターン処理を担う。

---

## 4. Backend Components / バックエンド構成
| Module / モジュール | Responsibility / 役割 |
| ------------------- | --------------------- |
| `backend/app/main.py` | FastAPI app setup, CORS, router mounting / FastAPIアプリ初期化、CORS設定、ルータ登録 |
| `backend/app/routes/lobby.py` | Lobby REST endpoints (create/join) / ロビー作成・参加のRESTエンドポイント |
| `backend/app/routes/ws.py` | WebSocket handshake & event loop / WebSocketハンドシェイクとイベントループ |
| `backend/app/core/models.py` | Data models (`Lobby`, `Player`, `GameState`, `Event`) / 各種データモデル定義 |
| `backend/app/core/lobby_manager.py` | In-memory store, turn rotation, cleanup / メモリ上のストアとターン制御、掃除処理 |
| `backend/app/core/game_logic.py` | Secret number generation, wraps `compare_guess` / 正解生成と`compare_guess`のラッパー |
| `backend/app/core/events.py` | Event schema definitions / イベントスキーマ定義 |

- MVP stores lobbies in-memory (dict keyed by lobby ID). Provide interface for a future Redis-based implementation.  
  MVPではロビーをIDをキーとした辞書でメモリ管理し、将来的にRedis実装へ切り替え可能なインターフェースを用意する。  
- Schedule cleanup for idle lobbies (async tasks).  
  一定時間活動のないロビーを非同期タスクでクリーンアップする。

---

## 5. Front-end Structure / フロントエンド構成
| File / ファイル | Updates / 変更点 |
| --------------- | ---------------- |
| `web/index.html` | Add lobby modal, player list, active player highlight, host controls. / ロビーモーダル・プレイヤー一覧・手番ハイライト・ホスト用操作を追加 |
| `web/script.js` | Implement client state store, WebSocket client, event handlers, UI renderers. / クライアント状態管理・WebSocketクライアント・イベントハンドラ・UI描画処理を実装 |
| `web/styles.css` | Style lobby/game panels, responsive layout, disabled states, notifications. / ロビーとゲームパネルのスタイル、レスポンシブ対応、無効化状態、通知表示を追加 |

Front-end flow / フロントエンドの流れ:
1. Display lobby modal → call REST API to create or join.  
   ロビーモーダルでAPIを呼び出し、ロビーを作成または参加。  
2. On success, open WebSocket to `/ws/{lobbyId}?playerId=...&token=...`.  
   成功したらWebSocketを開き、`/ws/{lobbyId}?playerId=...&token=...`へ接続。  
3. Receive `lobby_state` event to populate UI.  
   `lobby_state`イベントでUIを初期化。  
4. If player is active turn, enable guess input; others show waiting state.  
   手番プレイヤーは入力を有効化、他は待機画面を表示。  
5. Handle `guess_result`, `turn_update`, `win`, and `reset_ack` events.  
   `guess_result`・`turn_update`・`win`・`reset_ack`イベントでUIを更新。  
6. Allow host to trigger new round without refreshing.  
   ホストはページ更新なしに次ラウンドを開始できる。

---

## 6. Event Protocol / イベントプロトコル

### Client → Server / クライアント → サーバー
```json
{ "type": "join", "name": "Alice", "lobbyId": "ABCD", "token": "..." }
{ "type": "guess", "value": 12 }
{ "type": "reset" }
{ "type": "heartbeat" }
```
- `token` used for host-only actions (create/reset). / ホスト専用操作には`token`を使用。  
- Validate schema and turn ownership server-side. / サーバー側でスキーマと手番を検証。

### Server → Clients / サーバー → クライアント
```json
{ "type": "lobby_state", "players": [...], "turnPlayerId": "...", "round": 1 }
{ "type": "player_joined", "player": { ... } }
{ "type": "player_left", "playerId": "..." }
{ "type": "turn_update", "turnPlayerId": "...", "attempts": { ... } }
{ "type": "guess_result", "playerId": "...", "value": 12, "result": "low" }
{ "type": "win", "playerId": "...", "value": 17, "attempts": { ... } }
{ "type": "reset_ack", "round": 2 }
{ "type": "error", "message": "Lobby full" }
```
Clients use reducers to merge updates into local state.  
クライアントはリデューサーを通じて受信状態をローカルステートへ反映する。

---

## 7. Turn & Game Logic / ターンとゲームロジック
- `LobbyManager` maintains `players`, `current_turn_index`, `secret_number`, `attempts`.  
  `LobbyManager`がプレイヤー一覧、現在ターン、正解数、試行回数を管理する。  
- On `guess`, confirm the player holds the turn, run `compare_guess`.  
  `guess`受信時は手番プレイヤーであることを確認し`compare_guess`を実行。  
- Wrong guess: increment attempts, append history, rotate to next player, broadcast `turn_update`.  
  不正解なら試行回数と履歴を更新し次プレイヤーへ移行、`turn_update`を送信。  
- Correct guess: broadcast `win`, freeze inputs, keep round open until reset.  
  正解なら`win`イベントを送信して入力を停止、リセットまではラウンド完了状態を維持。  
- `reset` re-seeds the answer, clears attempts/history, retains players & order.  
  `reset`で正解を再生成し、試行履歴をリセット、プレイヤー構成は維持。

Optional / 任意: implement turn timeout (e.g., 30 seconds) with auto-advance and notify clients.  
ターンタイムアウト（例：30秒）を実装し、自動で次プレイヤーに進む運用も検討。

---

## 8. State Storage / 状態ストレージ
- MVP: Use in-memory dict keyed by lobby ID.  
  MVPではロビーIDをキーとしたメモリ内辞書を使用。  
- Interface-based design allows swapping to Redis without touching higher layers.  
  インターフェース層を設け、高層ロジックを変更せずRedis等へ差し替え可能。  
- Implement idle cleanup (e.g., lobbies with no activity for 15 minutes).  
  15分以上アクティビティのないロビーを自動クリーンアップする。

---

## 9. Security & Validation / セキュリティとバリデーション
- Generate lobby IDs with secure RNG (6–8 alphanumeric).  
  6〜8文字の英数字を安全な乱数で生成。  
- Host token required for reset/close actions.  
  リセットや終了はホストトークンが必要。  
- Sanitize player names, limit length (e.g., ≤ 24 chars).  
  プレイヤー名をサニタイズし、長さ制限（例：24文字以内）を設ける。  
- Rate-limit guesses per player turn to prevent spam.  
  推測は手番ごとにレート制限を設けスパムを防ぐ。

---

## 10. Observability / 可観測性
- Structured logs for lobby lifecycle, joins/leaves, guesses, wins.  
  ロビーライフサイクル、参加/離脱、推測、勝利を構造化ログで記録。  
- Provide `/health` endpoint; optional `/metrics` for Prometheus.  
  `/health`エンドポイントを提供、必要ならPrometheus用`/metrics`も追加。  
- Track metrics: active lobbies, avg round length, disconnect count.  
  メトリクスとしてアクティブロビー数、平均ラウンド時間、切断件数を追跡。

---

## 11. Testing Strategy / テスト戦略
- **Backend:** pytest + `httpx.AsyncClient`, `websocket-client` to simulate events.  
  バックエンドはpytest＋`httpx.AsyncClient`＋`websocket-client`でイベントをシミュレーション。  
- **Front-end:** multi-tab manual tests, Playwright/Cypress automation for join/guess/win flows.  
  フロントエンドは複数タブの手動テストとPlaywright/Cypressによる自動化。  
- Simulate network jitter, disconnect/reconnect sequences.  
  ネットワーク遅延や切断→再接続シナリオを検証。

---

## 12. Deployment / デプロイ
- **Local:** run backend via `uvicorn app.main:app --reload`; serve front-end via backend static or local server.  
  ローカルでは`uvicorn app.main:app --reload`でバックエンドを起動し、フロントエンドは同サーバーまたはローカルサーバーで配信。  
- **Production:** containerize (Docker), deploy to Render/Heroku/Fly. Use HTTPS (WSS).  
  本番ではDocker化してRender/Heroku/Flyへデプロイし、HTTPS/WSSで通信。  
- Configure CORS to allow expected domains; store secrets via environment vars.  
  CORSで許可ドメインを指定し、秘密情報は環境変数で管理。

---

## 13. Risks & Mitigations / リスクと対策
| Risk / リスク | Mitigation / 対策 |
| ------------- | ----------------- |
| Host disconnects mid-game | Promote next player or pause lobby; define policy. / ホスト離脱時は次プレイヤー昇格やロビー停止方針を定義 |
| Memory leaks (stale lobbies) | Idle cleanup task; optional TTL in Redis. / アイドル掃除・Redis利用時はTTL設定 |
| Client desync | All state changes originate from server events. / 状態変更はすべてサーバーイベント経由 |
| Animation overload on low-end devices | Respect `prefers-reduced-motion`, scale confetti count. / `prefers-reduced-motion`対応、紙吹雪の量を調整 |
| TLS / certificate issues | Use managed HTTPS platforms or configure certbot properly. / マネージドHTTPSを利用、またはcertbotで正しく設定 |

---

## 14. Next Steps / 今後のステップ
1. Finalize open questions (turn timer, host behavior, spectator support).  
   未決事項（ターンタイマー、ホスト離脱時、観戦機能）を確定する。  
2. Scaffold backend structure (`backend/`), implement `LobbyManager`.  
   `backend/`ディレクトリを用意し`LobbyManager`を実装する。  
3. Define shared event schema (`events.py` + front-end constants).  
   `events.py`とフロント側定数でイベントスキーマを統一する。  
4. Integrate front-end WebSocket client, lobby UI, state renderers.  
   フロントエンドへWebSocketクライアントとロビーUI、状態描画を実装する。  
5. Execute QA plan (multi-device, latency scenarios) and update documentation.  
   複数デバイス・遅延シナリオでQAを実施し、ドキュメントを更新する。
