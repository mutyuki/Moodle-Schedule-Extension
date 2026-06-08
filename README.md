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

### テスト

```bash
pnpm test
```

### テストのwatchモード

```bash
pnpm test:watch
```

## 開発メモ

- npmではなくpnpmを使います。
- フォーマットとリントはPrettier / ESLintではなくBiomeで実行します。
- テストはVitestで実行します。
- `package-lock.json`は作成せず、`pnpm-lock.yaml`を管理します。
