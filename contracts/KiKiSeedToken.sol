// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Mintable.sol";

// KiKiSeedToken with Governance.
contract KiKiSeedToken is ERC20("KiKi Seed Token", "KIKISEED"), Ownable {
    /// @dev Creates `_amount` token to `_to`. Must only be called by the owner (MasterChef).
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address _from ,uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }

    // The KIKI TOKEN!
    IERC20Mintable public kiki;

    constructor(
        IERC20Mintable _kiki
    ) public {
        kiki = _kiki;
    }

    // Safe kiki transfer function, just in case if rounding error causes pool to not have enough KIKIs.
    function safeKiKiTransfer(address _to, uint256 _amount) public onlyOwner {
        uint256 kikiBal = kiki.balanceOf(address(this));
        if (_amount > kikiBal) {
            kiki.transfer(_to, kikiBal);
        } else {
            kiki.transfer(_to, _amount);
        }
    }
}
