pragma solidity ^0.4.11;

import "./Terminable.sol";

contract Splitter is Terminable {

    struct SplitPart {
      address sender;
      uint amount;
    }
    struct RecipientBalances{
      uint num_elements;
      SplitPart[] split_parts;
    }
    mapping (address => RecipientBalances) recipient_balances;
    mapping (address => uint) sender_balances;

    event Split(address indexed sender, address indexed firstRecipient, address indexed secondRecipient, uint256 value);
    event Withdrawal(address indexed recipient, uint256 value);


    function split(address _firstRecipient, address _secondRecipient) public payable {
        require(msg.value > 0 && msg.sender.balance >= msg.value);
        require(msg.sender != _firstRecipient && msg.sender != _secondRecipient);
        require(_firstRecipient != address(0x0) && _secondRecipient != address(0x0));

        uint256 split_amount = msg.value/2;
        addSplitPart(_firstRecipient,msg.sender,split_amount);
        addSplitPart(_secondRecipient,msg.sender,split_amount);
        updateSenderBalance(msg.sender,msg.value);
        Split(msg.sender,_firstRecipient,_secondRecipient,split_amount);
    }

    function addSplitPart(address _to, address _from, uint _split_amount) internal
    {
      uint num_elements = recipient_balances[_to].num_elements;
      if(num_elements == recipient_balances[_to].split_parts.length)
      {
        recipient_balances[_to].split_parts.push(SplitPart(_from,_split_amount));
      }
      else
      {
        recipient_balances[_to].split_parts[num_elements].sender = _from;
        recipient_balances[_to].split_parts[num_elements].amount = _split_amount;
      }
      recipient_balances[_to].num_elements = safeAdd(recipient_balances[_to].num_elements,1);
    }

    function updateSenderBalance(address _sender, uint _amount) internal
    {
      sender_balances[_sender] = safeAdd(sender_balances[_sender],_amount);
    }

		function recipientBalanceOf(address _owner) constant returns (uint256 balance) {
        balance = 0;
        for(uint i=0; i<recipient_balances[_owner].num_elements;i++)
        {
          balance += recipient_balances[_owner].split_parts[i].amount;
        }
    }

    function senderBalanceOf(address _owner) constant returns (uint256 balance) {
        return sender_balances[_owner];
    }

    function withdraw() public {
        uint amount = 0;
        for(uint i=0; i<recipient_balances[msg.sender].num_elements;i++)
        {
          uint split_amount = recipient_balances[msg.sender].split_parts[i].amount;
          if(split_amount > 0)
          {
            amount = safeAdd(amount,split_amount);
            drainSender(recipient_balances[msg.sender].split_parts[i].sender,split_amount);
            recipient_balances[msg.sender].split_parts[i].amount = 0;
          }
        }
        require(amount>0);
        recipient_balances[msg.sender].num_elements = 0;
        msg.sender.transfer(amount);
        Withdrawal(msg.sender,amount);
    }

    function drainSender(address from, uint amount) internal {
      safeSub(sender_balances[from],amount);
    }

    function safeAdd(uint a, uint b) internal returns (uint c) {
      assert((c = a + b) >= a);
    }

    function safeSub(uint a, uint b) internal returns (uint c) {
      assert((c = a - b) <= a);
    }

}
