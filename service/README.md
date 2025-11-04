# Nuwa Faucet - EVM USDC 水龙头服务

一个基于 TypeScript 开发的 ERC20 代币（USDC）水龙头服务，使用 Supabase 记录领取记录，支持每个地址每24小时领取一次。

## 功能特性

- ✅ 支持 ERC20 代币（USDC）发放
- ✅ 每个地址每24小时可以领取一次代币
- ✅ 使用 Supabase 数据库记录领取历史
- ✅ 支持查询领取状态和历史记录
- ✅ RESTful API 接口
- ✅ TypeScript 类型安全
- ✅ 自动验证以太坊地址格式

## 技术栈

- **Node.js** + **TypeScript**
- **Express** - Web 框架
- **ethers.js** - 以太坊交互
- **Supabase** - 数据库服务
- **Zod** - 数据验证

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件并重命名为 `.env`，然后填写配置：

```bash
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# EVM 区块链配置 - 钱包（二选一）
# 方式1: 使用私钥
PRIVATE_KEY=your_private_key_here

# 方式2: 使用助记词（如果使用助记词，请注释掉上面的 PRIVATE_KEY）
# MNEMONIC=your twelve or twenty four word mnemonic phrase here
# MNEMONIC_INDEX=0  # 可选，默认为0

# 公共 RPC 节点（默认使用 Ethereum Sepolia 测试网）
RPC_URL=https://rpc.sepolia.org
CHAIN_ID=11155111

# 水龙头配置 - USDC Token
FAUCET_AMOUNT=10                           # 每次发放的 USDC 数量
TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238  # Sepolia USDC 合约地址
TOKEN_DECIMALS=6                           # USDC 使用 6 位小数
PORT=3000                                   # 服务端口
```

**常用公共 RPC 节点和 USDC 合约地址：**

| 网络 | RPC_URL | CHAIN_ID | USDC 合约地址 |
|------|---------|----------|-------------|
| Ethereum Sepolia | https://rpc.sepolia.org | 11155111 | 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 |
| Ethereum Goerli | https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 | 5 | 0x07865c6E87B9F70255377e024ace6630C1Eaa37F |
| Polygon Mumbai | https://rpc-mumbai.maticvigil.com | 80001 | 0x0FA8781a83E46826621b3BC094Ea2A0212e71B23 |
| Arbitrum Sepolia | https://sepolia-rollup.arbitrum.io/rpc | 421614 | 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d |
| Base Sepolia | https://sepolia.base.org | 84532 | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |

> **注意**: 这些是测试网的 USDC 合约地址。你需要确保水龙头钱包中有足够的 USDC 测试币。

### 3. 设置 Supabase 数据库

在 Supabase SQL 编辑器中运行以下 SQL 语句创建表：

```sql
CREATE TABLE faucet_claims (
  id BIGSERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  amount TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ip_address TEXT,
  CONSTRAINT address_lowercase CHECK (address = LOWER(address))
);

-- 创建索引以提高查询性能
CREATE INDEX idx_faucet_claims_address ON faucet_claims(address);
CREATE INDEX idx_faucet_claims_claimed_at ON faucet_claims(claimed_at);

-- 启用行级安全 (可选但推荐)
ALTER TABLE faucet_claims ENABLE ROW LEVEL SECURITY;

-- 创建策略允许公开读取
CREATE POLICY "Allow public read access" ON faucet_claims
  FOR SELECT USING (true);

-- 创建策略允许插入
CREATE POLICY "Allow public insert" ON faucet_claims
  FOR INSERT WITH CHECK (true);
```

### 4. 启动服务

开发模式（支持热重载）：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## API 接口文档

### 1. 领取代币

**请求**
```http
POST /api/faucet/claim
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**响应（成功）**
```json
{
  "success": true,
  "message": "USDC sent successfully!",
  "txHash": "0x123...",
  "amount": "10"
}
```

**响应（失败 - 24小时内已领取）**
```json
{
  "success": false,
  "message": "You can only claim once per 24 hours. Please try again in 12 hours.",
  "nextClaimTime": "2025-11-05T10:30:00.000Z"
}
```

### 2. 检查地址是否可以领取

**请求**
```http
GET /api/faucet/check/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**响应**
```json
{
  "success": true,
  "canClaim": true,
  "lastClaimTime": "2025-11-03T10:30:00.000Z"
}
```

### 3. 查询地址领取历史

**请求**
```http
GET /api/faucet/history/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb?limit=10
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "amount": "0.1",
      "tx_hash": "0x123...",
      "claimed_at": "2025-11-03T10:30:00.000Z",
      "ip_address": "192.168.1.1"
    }
  ]
}
```

### 4. 查询最近的领取记录

**请求**
```http
GET /api/faucet/recent?limit=20
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "address": "0x123...",
      "amount": "0.1",
      "tx_hash": "0x456...",
      "claimed_at": "2025-11-04T08:20:00.000Z"
    }
  ]
}
```

### 5. 获取水龙头信息

**请求**
```http
GET /api/faucet/info
```

**响应**
```json
{
  "success": true,
  "data": {
    "faucetAddress": "0x123...",
    "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "tokenSymbol": "USDC",
    "tokenName": "USD Coin",
    "tokenBalance": "1000.0",
    "nativeBalance": "0.5",
    "amountPerClaim": "10",
    "chainId": 11155111,
    "claimInterval": "24 hours"
  }
}
```

### 6. 健康检查

**请求**
```http
GET /health
```

**响应**
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T10:00:00.000Z"
}
```

## 项目结构

```
nuwa-faucet/
├── src/
│   ├── config/
│   │   ├── blockchain.ts      # 区块链配置（钱包、provider）
│   │   └── supabase.ts        # Supabase 客户端配置
│   ├── routes/
│   │   └── faucet.routes.ts   # API 路由定义
│   ├── services/
│   │   └── faucet.service.ts  # 水龙头核心业务逻辑
│   ├── scripts/
│   │   └── setup-db.ts        # 数据库设置说明
│   └── index.ts               # 应用入口
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 核心逻辑说明

### 24小时限制实现

系统通过以下步骤检查地址是否可以领取：

1. 查询 `faucet_claims` 表中该地址的最后一次领取记录
2. 计算当前时间与最后领取时间的差值
3. 如果差值 >= 24 小时，允许领取；否则返回下次可领取时间

### 地址规范化

所有地址在存储前都会转换为小写，确保 `0xABC...` 和 `0xabc...` 被视为同一地址。

### 安全性

- 使用环境变量存储敏感信息（私钥、API密钥）
- Supabase 支持行级安全策略
- 可选的 IP 地址记录用于额外的限流控制

## 开发

### 编译 TypeScript

```bash
npm run build
```

### 查看数据库设置说明

```bash
npm run setup-db
```

## 注意事项

1. **私钥安全**：请确保 `.env` 文件不要提交到版本控制系统
2. **USDC 余额**：定期检查水龙头钱包的 USDC 余额，确保有足够的代币发放
3. **ETH 余额**：确保钱包有足够的 ETH 支付 gas 费用（建议至少 0.1 ETH）
4. **RPC 限流**：某些公共 RPC 节点可能有请求限制，建议使用私有节点
5. **合约地址**：确认使用的是正确的测试网 USDC 合约地址

## 常见问题

### 1. 如何更改每次发放的 USDC 数量？

修改 `.env` 文件中的 `FAUCET_AMOUNT` 值（例如：`FAUCET_AMOUNT=10` 表示每次发放 10 USDC）。

### 2. 如何更改领取时间间隔？

修改 `src/services/faucet.service.ts` 中 `canClaim` 函数的时间检查逻辑（默认为24小时）。

### 3. 支持哪些 EVM 链？

支持所有 EVM 兼容链，只需在 `.env` 中配置对应的 RPC_URL、CHAIN_ID 和 TOKEN_ADDRESS（USDC 合约地址）。

### 4. 如何获取测试网的 USDC？

- **Sepolia**: 访问 [Circle Faucet](https://faucet.circle.com/) 或 [Chainlink Faucet](https://faucets.chain.link/)
- **其他测试网**: 搜索对应测试网的 USDC faucet

### 5. 为什么需要 ETH？

即使发送的是 USDC（ERC20 代币），仍然需要 ETH 来支付 gas 费用。确保水龙头钱包有足够的 ETH。

## License

MIT

