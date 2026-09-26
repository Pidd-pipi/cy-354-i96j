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

-- 失物招领启事（寻物 lost / 招领 found）
CREATE TABLE IF NOT EXISTS lf_notices (
  id VARCHAR(40) PRIMARY KEY,
  type ENUM('lost', 'found') NOT NULL COMMENT 'lost=寻物启事, found=招领启事',
  campus VARCHAR(60) NOT NULL COMMENT '校区',
  location VARCHAR(120) NOT NULL COMMENT '丢失/拾到地点',
  happen_at VARCHAR(32) NOT NULL COMMENT '丢失/拾到时间',
  item_name VARCHAR(80) NOT NULL COMMENT '物品名称',
  features VARCHAR(500) NOT NULL COMMENT '物品特征，认领时据此核对',
  contact VARCHAR(80) NOT NULL COMMENT '联系方式',
  publisher VARCHAR(40) NOT NULL COMMENT '发布人昵称',
  status ENUM('open', 'claimed', 'closed') NOT NULL DEFAULT 'open'
    COMMENT 'open=待认领, claimed=已有生效认领待线下核对, closed=已关闭',
  active_claim_id VARCHAR(40) NULL COMMENT '生效认领 ID；每则启事至多一条',
  close_reason ENUM('handover', 'owner_closed', 'expired') NULL
    COMMENT 'handover=线下交接完成, owner_closed=发布人关闭, expired=超期未认领',
  result_note VARCHAR(200) NULL COMMENT '交接结果/关闭说明',
  public_since TIMESTAMP NULL COMMENT '满 7 天无人认领转入公开列表的时间',
  expires_at TIMESTAMP NOT NULL COMMENT '认领截止时间（发布 +7 天）',
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lf_type_status (type, status),
  INDEX idx_lf_public (public_since)
) COMMENT='失物招领启事';

-- 认领匹配记录：重复或同时认领时先提交的生效，其余记录拒绝原因
CREATE TABLE IF NOT EXISTS lf_claims (
  id VARCHAR(40) PRIMARY KEY,
  notice_id VARCHAR(40) NOT NULL,
  claimant VARCHAR(40) NOT NULL COMMENT '认领人昵称',
  contact VARCHAR(80) NOT NULL COMMENT '认领人联系方式',
  feature_answer VARCHAR(500) NOT NULL COMMENT '认领人提交的物品特征',
  status ENUM('pending', 'matched', 'rejected') NOT NULL DEFAULT 'pending'
    COMMENT 'pending=待线下核对, matched=已确认交接, rejected=特征不符/已被认领/启事关闭',
  reject_reason VARCHAR(200) NULL COMMENT '未生效原因说明',
  decided_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lf_claim_notice FOREIGN KEY (notice_id) REFERENCES lf_notices (id),
  INDEX idx_lf_claim_notice (notice_id)
) COMMENT='失物招领认领匹配记录';
