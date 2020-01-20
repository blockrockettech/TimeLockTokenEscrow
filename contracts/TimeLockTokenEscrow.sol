pragma solidity 0.5.14;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TimeLockTokenEscrow is ReentrancyGuard {
    using SafeMath for uint256;

    struct TimeLock {
        uint256 amount;
        uint256 lockedUntil;
        bool claimed;
    }

    IERC20 public token;

    mapping(address => TimeLock) public beneficiaryToTimeLock;

    constructor(IERC20 _token) public {
        token = _token;
    }

    function lock(address _beneficiary, uint256 _amount, uint256 _lockedUntil) external nonReentrant {
        require(_beneficiary != address(0), "You cannot lock up tokens for the zero address");
        require(_amount > 0, "Lock up amount of zero tokens is invalid");
        require(beneficiaryToTimeLock[_beneficiary].amount == 0, "Tokens have already been locked up for the given address");
        require(token.allowance(msg.sender, address(this)) >= _amount, "The contract does not have enough of an allowance to escrow");

        beneficiaryToTimeLock[_beneficiary] = TimeLock({
            amount: _amount,
            lockedUntil: _lockedUntil,
            claimed: false
        });

        bool transferSuccess = token.transferFrom(msg.sender, address(this), _amount);
        require(transferSuccess, "Failed to escrow tokens into the contract");
    }

    function withdrawal(address _beneficiary) external nonReentrant {
        TimeLock storage lockup = beneficiaryToTimeLock[_beneficiary];
        require(lockup.amount > 0, "There are no tokens locked up for this address");
        require(!lockup.claimed, "Tokens have already been claimed");
        require(now >= lockup.lockedUntil, "Tokens are still locked up");

        lockup.claimed = true;

        bool transferSuccess = token.transfer(_beneficiary, lockup.amount);
        require(transferSuccess, "Failed to send tokens to the beneficiary");
    }

    function approvalAmount(address owner) external view returns (uint256) {
        return token.allowance(owner, address(this));
    }
}