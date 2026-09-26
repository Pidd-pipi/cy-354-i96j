-- 失物招领模块建表脚本（MySQL 8.0，utf8mb4）
-- 后端 TypeORM 开启 synchronize 时会自动建表，本脚本供手动初始化或排查时使用。

CREATE TABLE IF NOT EXISTS operation_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_name VARCHAR(120) NOT NULL,
  owner_name VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  metric VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO operation_records (module_name, owner_name, status, metric)
VALUES ('失物招领', '服务台', 'ready', '100%');

-- 寻物 / 招领启事
CREATE TABLE IF NOT EXISTS lost_found_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(8) NOT NULL COMMENT 'lost=寻物启事, found=招领登记',
  title VARCHAR(80) NOT NULL,
  category VARCHAR(40) NOT NULL,
  campus VARCHAR(60) NOT NULL COMMENT '校区',
  location VARCHAR(120) NOT NULL COMMENT '丢失/拾取地点',
  happened_at DATETIME NOT NULL COMMENT '丢失/拾取时间',
  features TEXT NOT NULL COMMENT '物品特征',
  contact_name VARCHAR(40) NOT NULL,
  contact_info VARCHAR(120) NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'open' COMMENT 'open=待认领, matched=已认领核对中, closed=已关闭',
  public_at DATETIME NULL COMMENT '招领满七天无人认领后转入公开列表的时间',
  result VARCHAR(255) NULL COMMENT '关闭时的处理结果',
  closed_at DATETIME NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_lf_posts_view (type, status, public_at),
  INDEX idx_lf_posts_campus (campus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 认领匹配记录（一则启事仅一条生效匹配）
CREATE TABLE IF NOT EXISTS lost_found_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  claimer_name VARCHAR(40) NOT NULL COMMENT '认领人',
  claimer_contact VARCHAR(120) NOT NULL,
  feature_proof TEXT NOT NULL COMMENT '认领人描述的物品特征',
  status VARCHAR(12) NOT NULL DEFAULT 'pending' COMMENT 'pending=待线下核对, confirmed=已交接, rejected=已驳回',
  reject_reason VARCHAR(255) NULL COMMENT '驳回原因，如特征不符',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_lf_claims_post FOREIGN KEY (post_id)
    REFERENCES lost_found_posts (id) ON DELETE CASCADE,
  INDEX idx_lf_claims_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
