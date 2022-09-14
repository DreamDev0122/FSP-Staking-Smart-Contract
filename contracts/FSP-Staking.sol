// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     _______                        _       __   _____                 _                   ____  __      __  ____                        _____ __        __   _                 //
//    / ____(_)___  ____ _____  _____(_)___ _/ /  / ___/___  ______   __(_)_______  _____   / __ \/ /___ _/ /_/ __/___  _________ ___     / ___// /_____ _/ /__(_)___  ____ _     //
//   / /_  / / __ \/ __ `/ __ \/ ___/ / __ `/ /   \__ \/ _ \/ ___/ | / / / ___/ _ \/ ___/  / /_/ / / __ `/ __/ /_/ __ \/ ___/ __ `__ \    \__ \/ __/ __ `/ //_/ / __ \/ __ `/     //
//  / __/ / / / / / /_/ / / / / /__/ / /_/ / /   ___/ /  __/ /   | |/ / / /__/  __(__  )  / ____/ / /_/ / /_/ __/ /_/ / /  / / / / / /   ___/ / /_/ /_/ / ,< / / / / / /_/ /      //
// /_/   /_/_/ /_/\__,_/_/ /_/\___/_/\__,_/_/   /____/\___/_/    |___/_/\___/\___/____/  /_/   /_/\__,_/\__/_/  \____/_/  /_/ /_/ /_/   /____/\__/\__,_/_/|_/_/_/ /_/\__, /       //
//                                                                                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 *
 * _Available since v4.1._
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _setOwner(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _setOwner(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _setOwner(newOwner);
    }

    function _setOwner(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: @openzeppelin/contracts/utils/ReentrancyGuard.sol

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}

// File: @openzeppelin/contracts/utils/Address.sol

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(
            address(this).balance >= amount,
            "Address: insufficient balance"
        );

        (bool success, ) = recipient.call{value: amount}("");
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data)
        internal
        returns (bytes memory)
    {
        return functionCall(target, data, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return
            functionCallWithValue(
                target,
                data,
                value,
                "Address: low-level call with value failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(
            address(this).balance >= value,
            "Address: insufficient balance for call"
        );
        require(isContract(target), "Address: call to non-contract");

        (bool success, bytes memory returndata) = target.call{value: value}(
            data
        );
        return _verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data)
        internal
        view
        returns (bytes memory)
    {
        return
            functionStaticCall(
                target,
                data,
                "Address: low-level static call failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");

        (bool success, bytes memory returndata) = target.staticcall(data);
        return _verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data)
        internal
        returns (bytes memory)
    {
        return
            functionDelegateCall(
                target,
                data,
                "Address: low-level delegate call failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");

        (bool success, bytes memory returndata) = target.delegatecall(data);
        return _verifyCallResult(success, returndata, errorMessage);
    }

    function _verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) private pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}

// File: "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transferFrom.selector, from, to, value)
        );
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.approve.selector, spender, value)
        );
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(
                token.approve.selector,
                spender,
                newAllowance
            )
        );
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(
                oldAllowance >= value,
                "SafeERC20: decreased allowance below zero"
            );
            uint256 newAllowance = oldAllowance - value;
            _callOptionalReturn(
                token,
                abi.encodeWithSelector(
                    token.approve.selector,
                    spender,
                    newAllowance
                )
            );
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(
            data,
            "SafeERC20: low-level call failed"
        );
        if (returndata.length > 0) {
            // Return data is optional
            require(
                abi.decode(returndata, (bool)),
                "SafeERC20: ERC20 operation did not succeed"
            );
        }
    }
}

// File: IPancakeProfile.sol

/**
 * @title IPancakeProfile
 */
interface IPancakeProfile {
    function createProfile(
        uint256 _teamId,
        address _nftAddress,
        uint256 _tokenId
    ) external;

    function increaseUserPoints(
        address _userAddress,
        uint256 _numberPoints,
        uint256 _campaignId
    ) external;

    function removeUserPoints(address _userAddress, uint256 _numberPoints)
        external;

    function addNftAddress(address _nftAddress) external;

    function addTeam(
        string calldata _teamName,
        string calldata _teamDescription
    ) external;

    function getUserProfile(address _userAddress)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            address,
            uint256,
            bool
        );

    function getUserStatus(address _userAddress) external view returns (bool);

    function getTeamProfile(uint256 _teamId)
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256,
            bool
        );
}

// File: contracts/SmartChefInitializable.sol

contract SmartChefInitializable is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;
    using SafeMath for uint256;

    // The address of the token to stake
    IERC20Metadata public stakedToken;

    // Number of reward tokens supplied for the pool
    uint256 public rewardSupply;

    // desired APY
    uint256 public APYPercent;

    // lock time of pool
    uint256 public lockTime;

    // maximum number tokens that can be staked in the pool
    uint256 public maxTokenSupply;

    // The reward token
    IERC20Metadata public rewardToken;

    // reflection token or not
    bool public isReflectionToken;

    // Reflection contract address if staked token has refection token (null address if none)
    IERC20Metadata public reflectionToken;

    // Staked token symbol
    string public stakedTokenSymbol;

    // Reflection token symbol
    string public reflectionTokenSymbol;

    // The staked token amount limit per user (0 if none)
    uint256 public limitAmountPerUser;

    // The address of the smart chef factory
    address public immutable SMART_CHEF_FACTORY;

    // Whether a limit is set for users
    bool public userLimit;

    // Whether it is initialized
    bool public isInitialized;

    // The block number of the last pool update
    uint256 public lastRewardBlock;

    // Reward percent
    uint256 public rewardPercent;

    bool public isStopped;

    uint256 private stopTime;

    uint256 public depositFee = 0.007 ether;

    uint256 public withdrawFee = 0.014 ether;

    uint256 public emergencyWithdrawFee = 0.03 ether;

    // Info of each user that stakes tokens (stakedToken)
    mapping(address => UserInfo) public userInfo;
    address[] public stakedUserList;

    struct UserInfo {
        uint256 amount; // How many staked tokens the user has provided
        uint256 depositTime; // Deposit time
        uint256 rewardDebt; // Reward Debt
    }

    event Deposit(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event NewStartAndEndBlocks(uint256 startBlock, uint256 endBlock);
    event NewRewardPerBlock(uint256 rewardPerBlock);
    event NewUserLimitAmount(uint256 poolLimitPerUser);
    event RewardsStop(uint256 blockNumber);
    event TokenRecovery(address indexed token, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event UpdateProfileAndThresholdPointsRequirement(
        bool isProfileRequested,
        uint256 thresholdPoints
    );

    /**
     * @notice Constructor
     */
    constructor() {
        SMART_CHEF_FACTORY = msg.sender;
    }

    /*
     * @notice Initialize the contract
     * @param _stakedToken: staked token address
     * @param _reflectionToken: _reflectionToken token address
     * @param _rewardSupply: Reward Supply Amount
     * @param _APYPercent: APY
     * @param _lockTimeType: Lock Time Type 
               0 - 1 year 
               1- 180 days 
               2- 90 days 
               3 - 30 days
     * @param _maxTokenSupply: Max Token Supply Amount
     * @param _limitAmountPerUser: Pool limit per user in stakedToken
     * @param _stakedTokenSymbol: staked token symbol
     * @param _reflectionTokenSymbol: reflection token symbol
     * @param _admin: admin address with ownership
     */
    function initialize(
        IERC20Metadata _stakedToken,
        IERC20Metadata _reflectionToken,
        uint256 _rewardSupply,
        uint256 _APYPercent,
        uint256 _lockTimeType,
        uint256 _maxTokenSupply,
        uint256 _limitAmountPerUser,
        string memory _stakedTokenSymbol,
        string memory _reflectionTokenSymbol,
        address _admin
    ) external {
        require(!isInitialized, "Already initialized");
        require(msg.sender == SMART_CHEF_FACTORY, "Not factory");

        // Make this contract initialized
        isInitialized = true;

        stakedToken = _stakedToken;
        reflectionToken = _reflectionToken;
        APYPercent = _APYPercent;
        if (address(_reflectionToken) != address(0)) {
            isReflectionToken = true;
            reflectionToken = _reflectionToken;
        }
        if (_limitAmountPerUser > 0) {
            userLimit = true;
            limitAmountPerUser = _limitAmountPerUser;
        }
        
        lockTime = _lockTimeType == 0 ? 365 days : _lockTimeType == 1
            ? 180 days
            : _lockTimeType == 2
            ? 90 days
            : 30 days;

        rewardPercent = _lockTimeType == 0 ? 100000 : _lockTimeType == 1
            ? 49310
            : _lockTimeType == 2
            ? 24650
            : 8291;

        stakedTokenSymbol = _stakedTokenSymbol;
        reflectionTokenSymbol = _reflectionTokenSymbol;
        maxTokenSupply = _maxTokenSupply;
        rewardSupply = _rewardSupply;

        // Transfer ownership to the admin address who becomes owner of the contract
        transferOwnership(_admin);
    }

    
    /*
     * @notice Deposit staked tokens and collect reward tokens (if any)
     * @param _amount: amount to deposit
     */
    function deposit(uint256 _amount) external payable nonReentrant {
        require(msg.value >= getDepositFee(), "deposit fee is not enough");

        UserInfo storage user = userInfo[msg.sender];

        require(
            !userLimit || ((_amount + user.amount) <= limitAmountPerUser),
            "Deposit: Amount above limit"
        );

        stakedUserList.push(msg.sender);
        // _updatePool();

        if(user.amount > 0) {
            uint256 reward = _getRewardAmount(user.amount, msg.sender);
            user.rewardDebt += reward;
        }

        if (_amount > 0) {
            user.amount = user.amount + _amount;
            user.depositTime = block.timestamp;
            stakedToken.safeTransferFrom(
                address(msg.sender),
                address(this),
                _amount
            );
        }
        emit Deposit(msg.sender, _amount);
    }

    /*
     * @notice Withdraw staked tokens and collect reward tokens
     * @param _amount: amount to withdraw (in rewardToken)
     */
    function withdraw(uint256 _amount) external payable nonReentrant {
        require(msg.value >= getWithdrawFee(), "withdraw fee is not enough");

        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Amount to withdraw too high");
        require(
            isStopped || user.depositTime + lockTime <= block.timestamp,
            "You should wait until lock time"
        );

        // _updatePool();

        if (_amount > 0) {
            uint256 rewardAmount = _amount.add(
                _getRewardAmount(_amount, msg.sender)
            );
            user.amount = user.amount - _amount;
            stakedToken.safeTransfer(address(msg.sender), rewardAmount);
        }

        if (isReflectionToken) {
            uint256 reflectionAmount = _getReflectionAmount(_amount);
            if (reflectionAmount > 0) {
                reflectionToken.transfer(address(msg.sender), reflectionAmount);
            }
        }
        emit Withdraw(msg.sender, _amount);
    }

    function withdrawAll() external payable nonReentrant {
        require(msg.value >= getWithdrawFee(), "withdraw fee is not enough");

        UserInfo storage user = userInfo[msg.sender];
        require(
            isStopped || user.depositTime + lockTime <= block.timestamp,
            "You should wait until lock time"
        );

        // _updatePool();

        if (user.amount > 0) {
            uint256 rewardAmount = user.rewardDebt + user.amount + _getRewardAmount(user.amount, msg.sender);
            user.amount = 0;
            user.rewardDebt = 0;
            stakedToken.safeTransfer(address(msg.sender), rewardAmount);
        }

        if (isReflectionToken) {
            uint256 reflectionAmount = _getReflectionAmount(user.amount);
            if (reflectionAmount > 0) {
                reflectionToken.transfer(address(msg.sender), reflectionAmount);
            }
        }
        emit Withdraw(msg.sender, user.amount);
    }

    /*
     * @notice Withdraw staked tokens without caring about rewards rewards
     * @dev Needs to be for emergency.
     */
    function emergencyWithdraw() external payable nonReentrant {
        require(
            msg.value >= getEmergencyWithdrawFee(),
            "early withdraw fee is not enough"
        );

        UserInfo storage user = userInfo[msg.sender];
        uint256 amountToTransfer = user.amount;
        user.amount = 0;
        user.depositTime = 0;
        user.rewardDebt = 0;

        if (amountToTransfer > 0) {
            stakedToken.safeTransfer(address(msg.sender), amountToTransfer);
        }

        emit EmergencyWithdraw(msg.sender, user.amount);
    }

    /*
     * @notice Stop rewards
     * @dev Only callable by owner
     */
    function stopReward() external onlyOwner {
        isStopped = true;
        stopTime = block.timestamp;
    }

    /*
     * @notice Update token amount limit per user
     * @dev Only callable by owner.
     * @param _userLimit: whether the limit remains forced
     * @param _limitAmountPerUser: new pool limit per user
     */
    function updatePoolLimitPerUser(
        bool _userLimit,
        uint256 _limitAmountPerUser
    ) external onlyOwner {
        require(userLimit, "Must be set");
        if (_userLimit) {
            require(
                _limitAmountPerUser > limitAmountPerUser,
                "New limit must be higher"
            );
            limitAmountPerUser = _limitAmountPerUser;
        } else {
            userLimit = _userLimit;
            limitAmountPerUser = 0;
        }
        emit NewUserLimitAmount(limitAmountPerUser);
    }

    
    function getDepositFee() public view returns (uint256) {
        return depositFee.mul(rewardPercent).div(10**5);
    }

    function getWithdrawFee() public view returns (uint256) {
        return withdrawFee.mul(rewardPercent).div(10**5);
    }

    function getEmergencyWithdrawFee() public view returns (uint256) {
        return emergencyWithdrawFee.mul(rewardPercent).div(10**5);
    }

    function getTotalStaked() public view returns (uint256) {
       uint256 _totalStaked = 0;
       for(uint256 id = 0; id < stakedUserList.length ; id++) {
         _totalStaked += userInfo[stakedUserList[id]].amount;
       }  
       return _totalStaked;
    }

    /*
     * @notice Update reward variables of the given pool to be up-to-date.
     */
    function _updatePool() internal {
      // TODO
    }

    /*
     * @notice View function to see pending reward on frontend.
     * @param _user: user address
     * @return Pending reward for a given user
     */
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 rewardAmount = user.rewardDebt + _getRewardAmount(user.amount, _user);
        return rewardAmount;
    }

    /*
     * @notice Return reward amount of user.
     * @param _user: user address to calculate reward amount
     */
    function _getRewardAmount(uint256 amount, address _user)
        internal
        view
        returns (uint256)
    {
        UserInfo storage user = userInfo[_user];
        uint256 rewardPerSecond = (((amount.mul(APYPercent)).div(100)).mul(rewardPercent).div(10**5)).div(lockTime);
        uint256 rewardAmount;
        if (isStopped && stopTime < (user.depositTime + lockTime )) {
            rewardAmount = rewardPerSecond.mul(stopTime.sub(user.depositTime));
        } else if (block.timestamp >= (user.depositTime + lockTime)) {
            rewardAmount = rewardPerSecond.mul(lockTime);
        } else {
            rewardAmount = rewardPerSecond.mul(block.timestamp - user.depositTime);
        }
        return rewardAmount;
    }

    /*
     * @notice Return reflection amount of user.
     * @param amount: amount to withdraw
     */
    function _getReflectionAmount(uint256 amount)
        internal
        view
        returns (uint256)
    {
        uint256 reflectionAmount = 0;
        if (isReflectionToken) {
            reflectionAmount = (
                amount.div(stakedToken.balanceOf(address(this)))
            ).mul(reflectionToken.balanceOf(address(this)));
        }
        return reflectionAmount;
    }

    /*
     * @notice Return user limit is set or zero.
     */
    function hasUserLimit() public view returns (bool) {
        if (!userLimit) {
            return false;
        }

        return true;
    }

}

// File: contracts/SmartChefFactory.sol

contract SmartChefFactory is Ownable {
    mapping(address => address[]) public pools;
    uint256 public poolCreateFee = 2 ether;
    uint256 public rewardRatio1 = 100000; // 1 year Pool
    uint256 public rewardRatio2 = 49310; // 180 days Pool
    uint256 public rewardRatio3 = 24650; // 90 days Pool 
    uint256 public rewardRatio4 = 8291; // 30 days Pool

    event NewSmartChefContract(address indexed smartChef);

    constructor() {
        //
    }

    function deployPool(
        IERC20Metadata _stakedToken,
        IERC20Metadata _reflectionToken,
        uint256 _rewardSupply,
        uint256 _APYPercent,
        uint256 _lockTimeType,
        uint256 _limitAmountPerUser,
        string memory _stakedTokenSymbol,
        string memory _reflectionTokenSymbol
    ) external payable {
        require(
            _lockTimeType >= 0 && _lockTimeType < 4,
            "Lock Time Type is not correct"
        );

        uint256 rewardRatio = _lockTimeType == 0
            ? rewardRatio1
            : _lockTimeType == 1
            ? rewardRatio2
            : _lockTimeType == 2
            ? rewardRatio3
            : rewardRatio4;

        uint256 customPoolCreateFee = (poolCreateFee * rewardRatio) / 10 ** 5;
        require(customPoolCreateFee <= msg.value, "Pool Price is not correct.");
        
        require(_stakedToken.totalSupply() >= 0);
        require(_reflectionToken.totalSupply() >= 0);

        require(
            _stakedToken != _reflectionToken,
            "Tokens must be be different"
        );

        bytes memory bytecode = type(SmartChefInitializable).creationCode;
        // pass constructor argument

        bytes32 salt = keccak256(
            abi.encodePacked(_stakedToken, _reflectionToken)
        );
        address smartChefAddress;

        assembly {
            smartChefAddress := create2(
                0,
                add(bytecode, 32),
                mload(bytecode),
                salt
            )
        }

        uint256 _maxTokenSupply = (((_rewardSupply / _APYPercent) * 100) /
            rewardRatio) * 10**5;

        IERC20(_stakedToken).transferFrom(
            msg.sender,
            address(this),
            _rewardSupply
        );

        SmartChefInitializable(smartChefAddress).initialize(
            _stakedToken,
            _reflectionToken,
            _rewardSupply,
            _APYPercent,
            _lockTimeType,
            _maxTokenSupply,
            _limitAmountPerUser,
            _stakedTokenSymbol,
            _reflectionTokenSymbol,
            msg.sender
        );

        IERC20(_stakedToken).transfer(smartChefAddress, _rewardSupply);
        emit NewSmartChefContract(smartChefAddress);
    }

    function updatePoolCreateFee(uint256 _poolCreateFee) external onlyOwner {
        poolCreateFee = _poolCreateFee;
    }

    /**
     * @notice Transfer ETH and return the success status.
     * @dev This function only forwards 30,000 gas to the callee.
     * @param to Address for ETH to be send to
     * @param value Amount of ETH to send
     */
    function _safeTransferETH(address to, uint256 value)
        internal
        returns (bool)
    {
        (bool success, ) = to.call{value: value, gas: 30_000}(new bytes(0));
        return success;
    }

    /**
     * @notice Allows owner to withdraw ETH funds to an address
     * @dev wraps _user in payable to fix address -> address payable
     * @param to Address for ETH to be send to
     * @param amount Amount of ETH to send
     */
    function withdraw(address payable to, uint256 amount) public onlyOwner {
        require(_safeTransferETH(to, amount));
    }

    /**
     * @notice Allows ownder to withdraw any accident tokens transferred to contract
     * @param _tokenContract Address for the token
     * @param to Address for token to be send to
     * @param amount Amount of token to send
     */
    function withdrawToken(
        address _tokenContract,
        address to,
        uint256 amount
    ) external {
        IERC20 tokenContract = IERC20(_tokenContract);
        tokenContract.transfer(to, amount);
    }
}
