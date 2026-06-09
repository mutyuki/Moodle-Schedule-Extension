# Moodle Schdule Extention

Chrome拡張機能用のJavaScriptプロジェクトです。

パッケージマネージャーはpnpm、フォーマッターとリンターはBiome、テストはVitestを使います。
Chrome拡張機能の設定はManifest V3の`manifest.json`を起点にします。

## 必要なもの

- pnpm
- ChromeまたはChromium系ブラウザ

## セットアップ

```bash
pnpm install
```

## コマンド

### フォーマット

```bash
pnpm format
```

### フォーマットチェック

```bash
pnpm format:check
```

### リント

```bash
pnpm lint
```

### Biomeチェック

```bash
pnpm check
```

### ビルド

```bash
pnpm build
```

### テスト

```bash
pnpm test
```

### テストのwatchモード

```bash
pnpm test:watch
```

## CI/CD

GitHub ActionsでCIとChrome拡張機能用zipの作成を実行します。

CIはPull Request作成時と`main`ブランチへのpush時に実行されます。依存関係は`pnpm install --frozen-lockfile`でインストールし、次のコマンドを順番に実行します。

```bash
pnpm format:check
pnpm lint
pnpm test
pnpm build
```

CDは`main`ブランチへのpush時と手動実行時に実行されます。`pnpm build`で作成した`dist/`をzip化し、`extension.zip`をGitHub Actionsのartifactとして保存します。

```bash
pnpm build
cd dist
zip -r ../extension.zip .
```

## 開発メモ

- npmではなくpnpmを使います。
- フォーマットとリントはPrettier / ESLintではなくBiomeで実行します。
- テストはVitestで実行します。
- `package-lock.json`は作成せず、`pnpm-lock.yaml`を管理します。
