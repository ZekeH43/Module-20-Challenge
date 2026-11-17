pragma solidity ^0.5.0;

/**
 * @title JointSavings
 * @notice Educational two-account savings demo, NOT an audited multisig wallet.
 * Either registered account may withdraw its own funds. No two-party approval.
 */
contract JointSavings {
    address public owner;
    address payable public accountOne;
    address payable public accountTwo;
    address public lastToWithdraw;
    uint public lastWithdrawAmount;
    uint public contractBalance;
    bool public accountsConfigured;

    event AccountsConfigured(address indexed firstAccount, address indexed secondAccount);
    event Deposit(address indexed sender, uint amount, uint newBalance);
    event Withdrawal(address indexed recipient, uint amount, uint newBalance);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the deployer can configure accounts");
        _;
    }

    /**
     * @notice Configure the approved account holders once.
     * An unrestricted setAccounts() could let anyone replace the holders and
     * drain the contract; this function is intentionally owner-only.
     */
    function setAccounts(address payable account1, address payable account2)
        public
        onlyOwner
    {
        require(!accountsConfigured, "Accounts have already been configured");
        require(account1 != address(0) && account2 != address(0), "Zero account");
        require(account1 != account2, "Accounts must be different");

        accountOne = account1;
        accountTwo = account2;
        accountsConfigured = true;
        emit AccountsConfigured(account1, account2);
    }

    /**
     * @notice A registered account can withdraw only to its own address.
     * This is *not* a joint-approval or shared-spending-limit implementation.
     */
    function withdraw(uint amount, address payable recipient) public {
        require(accountsConfigured, "Configure accounts first");
        require(
            msg.sender == accountOne || msg.sender == accountTwo,
            "Only a registered account may withdraw"
        );
        require(recipient == msg.sender, "Withdraw only to your own account");
        require(amount > 0, "Amount must be positive");
        require(address(this).balance >= amount, "Insufficient funds");

        // Record state before the external transfer.
        lastToWithdraw = recipient;
        lastWithdrawAmount = amount;
        recipient.transfer(amount);

        contractBalance = address(this).balance;
        emit Withdrawal(recipient, amount, contractBalance);
    }

    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be positive");
        contractBalance = address(this).balance;
        emit Deposit(msg.sender, msg.value, contractBalance);
    }

    // Historical Solidity 0.5 fallback syntax: accepts direct Ether transfers.
    function() external payable {
        contractBalance = address(this).balance;
        emit Deposit(msg.sender, msg.value, contractBalance);
    }
}
