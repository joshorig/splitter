pragma solidity ^0.4.11;

import "./Terminable.sol";

contract Splitter is Terminable {

    modifier noEther() {
        assert(msg.value == 0);
        _;
    }

    mapping (address => uint) public balances;

    event Split(address indexed sender, address indexed firstRecipient, address indexed secondRecipient, uint256 value);
    event Withdrawal(address indexed recipient, uint256 value);

    function split(address _firstRecipient, address _secondRecipient)
    public
    payable {
        require(msg.sender != _firstRecipient && msg.sender != _secondRecipient);
        require(_firstRecipient != address(0x0) && _secondRecipient != address(0x0));

        uint splitAmount = msg.value/2;
        balances[_firstRecipient] = safeAdd(balances[_firstRecipient],splitAmount);
        balances[_secondRecipient] = safeAdd(balances[_secondRecipient],splitAmount);
        if(splitAmount % 2 == 1)
        {
          balances[msg.sender] = safeAdd(balances[msg.sender],splitAmount);
        }
        Split(msg.sender,_firstRecipient,_secondRecipient,splitAmount);
    }


    function withdraw()
    public
    noEther {
        uint amount = balances[msg.sender];
        require(amount>0);
        balances[msg.sender] = 0;
        Withdrawal(msg.sender,amount);
        msg.sender.transfer(amount);
    }

    function safeAdd(uint a, uint b) internal returns (uint c) {
      assert((c = a + b) >= a);
    }

    function() {
      throw;
    }

}
