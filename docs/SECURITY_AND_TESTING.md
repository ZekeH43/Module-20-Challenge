# Security considerations and manual tests

## Threat model

The original homework demonstrates Solidity state, payable functions, account configuration, and Ether transfers. It is **not a two-signature wallet**: either registered account can withdraw its own share or, if funds are unpartitioned, the full available balance. It has no spending limits, emergency pause, time locks, recovery mechanism, or independent audit. Do not use on a live network with real funds.

The historical version of `setAccounts` had no access control, so any wallet could replace the authorized accounts and withdraw. The updated version introduces a deployer-only, one-time setup. `withdraw` now enforces that the caller is one of the two registered accounts and the recipient equals the caller.

The `contractBalance` variable is refreshed on ordinary deposits, fallback transfers, and withdrawals. As with any cached balance, forced Ether transfers may cause temporary differences; the withdrawal check reads `address(this).balance` directly.

## Manual test matrix (Remix, Solidity compiler 0.5.17)

Use an ephemeral deployment in Remix's simulated local environment. Test with its separate addresses (deployer D, approved A and B, unapproved X). Use small units of simulated Ether only.

| Test | Expected result |
| --- | --- |
| X calls `setAccounts(A, B)` | Reverts (only deployer) |
| D calls `setAccounts(0x0, B)` | Reverts (zero address) |
| D calls `setAccounts(A, A)` | Reverts (distinct addresses required) |
| D calls `setAccounts(A, B)` | Success; one `AccountsConfigured` event |
| D tries to reset the accounts | Reverts (one-time setup) |
| Deposit 2 test ETH through `deposit` | Balance is 2 ETH and `Deposit` emitted |
| X calls `withdraw` | Reverts (unregistered caller) |
| A tries to withdraw to B | Reverts (recipient must equal caller) |
| A tries to withdraw more than balance | Reverts (insufficient funds) |
| A withdraws 1 test ETH to A | Success; updated balance and `Withdrawal` event |
| Direct transfer to contract fallback | Balance updates and `Deposit` event |
| Call `deposit` with zero value | Reverts |

## Known limitations

- Compatible with old Solidity 0.5.x syntax; modern Solidity projects usually require updates.
- Uses `transfer`, which may fail for smart-contract recipients with more expensive fallback logic under post-Istanbul gas rules.
- Two individually authorized withdrawals are **not** dual authorization.
- Automated Solidity compilation and a local-chain regression suite are included in `tests/joint_savings.test.cjs`. The suite checks authorization, input validation, event emission, account funding, and withdrawal outcomes. Fuzzing, formal verification, and an independent security audit remain future work.
- Changes to contract permissions and behavior must be reviewed before any deployment.

**The test suite is not a formal security audit or production deployment. Check the latest GitHub Actions result to confirm compilation and local EVM execution.**
