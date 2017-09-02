pragma solidity ^0.4.11;

import "./Terminable.sol";

contract Splitter is Terminable {

    mapping (address => uint) public balances;

    event LogSplit(address indexed sender, address indexed firstRecipient, address indexed secondRecipient, uint256 amount);
    event LogWithdrawal(address indexed recipient, uint256 amount);

    function split(address _firstRecipient, address _secondRecipient)
    public
    payable
    returns (bool success)
    {
        require(msg.sender != _firstRecipient && msg.sender != _secondRecipient);
        require(_firstRecipient != address(0x0) && _secondRecipient != address(0x0));

        uint splitAmount = msg.value/2;
        balances[_firstRecipient] = safeAdd(balances[_firstRecipient],splitAmount);
        balances[_secondRecipient] = safeAdd(balances[_secondRecipient],splitAmount);
        if(msg.value % 2 == 1)
        {
          balances[msg.sender] = safeAdd(balances[msg.sender],1);
        }
        LogSplit(msg.sender,_firstRecipient,_secondRecipient,splitAmount);
        return true;
    }


    function withdraw()
    public
    returns (bool success)
    {
        uint amount = balances[msg.sender];
        require(amount>0);
        balances[msg.sender] = 0;
        LogWithdrawal(msg.sender,amount);
        msg.sender.transfer(amount);
        return true;
    }

    function safeAdd(uint a, uint b) internal returns (uint c) {
      assert((c = a + b) >= a);
    }

    function() {
      throw;
    }

}
