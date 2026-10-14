ALTER TABLE wallets
    ADD CONSTRAINT chk_wallet_balance_nonnegative CHECK (balance >= 0);

ALTER TABLE transactions
    ADD CONSTRAINT uq_transaction_original UNIQUE (original_transaction_id);
