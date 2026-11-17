# JointSavings — Solidity Course Project

An educational Ethereum smart-contract assignment for storing Ether with two configured recipient addresses. The contract is kept in its **original Solidity 0.5.x language family** but has been hardened to address a serious unauthorized-account-replacement flaw in the historical version.

**Not for real assets:** The code is a learning exercise, not an audited wallet, escrow, or multisignature implementation. Either approved account can withdraw the available balance without the other account's approval.

## Source and assignment

- [Smart contract](Starter_Code/Starter_Code/joint_savings.sol)
- [Original course instructions](Starter_Code/README.md)
- [Security review and manual Remix test plan](docs/SECURITY_AND_TESTING.md)

## Local compilation and demonstration

1. Open [Remix IDE](https://remix.ethereum.org/) and load `Starter_Code/Starter_Code/joint_savings.sol`.
2. Choose a compatible **Solidity 0.5.x compiler** (for example, 0.5.17) and compile.
3. Deploy in the Remix local simulated environment with **test Ether only**.
4. As the deployer, call `setAccounts` with two distinct nonzero test addresses. This can only be done once.
5. Call `deposit` with a nonzero payable amount (or send Ether directly to the fallback).
6. Switch to one registered account, call `withdraw(amount, that_account)`, and verify the balance and event logs.

See the manual [verification checklist](docs/SECURITY_AND_TESTING.md) before treating the exercise as understood. There is no automated Solidity CI suite in this repository; **compilation and runtime tests have not been performed as part of this PR**.

## What changed and why

The historical contract allowed **any address** to call `setAccounts`, making it possible for a third party to replace both authorized recipients. The revised contract restricts the configuration to the deployer, prevents later changes, rejects zero/duplicate accounts, and only allows a registered caller to withdraw to **their own** address. Deposit and withdrawal events were also added, and withdrawals use the actual Ether balance instead of relying solely on a cached variable.

These are behavior changes compared with the original assignment: a registered user cannot initiate a withdrawal to the *other* registered user, and the addresses cannot be reconfigured after setup.

## Historical submission screenshots

1 Eth Sent 
![image](https://github.com/ZekeH43/Module-20-Challenge/assets/143846311/6187774a-c15e-4aa9-aceb-626d44af6c75)



10 Eth sent

![image](https://github.com/ZekeH43/Module-20-Challenge/assets/143846311/5f87e521-9d3c-4002-a817-2992c1aa9813)




5 Eth sent
![image](https://github.com/ZekeH43/Module-20-Challenge/assets/143846311/457505c5-f203-40b0-85c3-528ffa670182)



![image](https://github.com/ZekeH43/Module-20-Challenge/assets/143846311/ed066c20-aac2-4e1c-9444-ff8d5fe86d32)




![image](https://github.com/ZekeH43/Module-20-Challenge/assets/143846311/1a54d944-19d3-413f-b0e7-92c17403a4e2)
