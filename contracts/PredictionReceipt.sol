// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PredictionReceipt is AccessControl, Pausable, ReentrancyGuard {
    // -------------------------
    // ROLES
    // -------------------------
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // -------------------------
    // EIP-712 DOMAIN
    // -------------------------
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant PREDICTION_TYPEHASH =
        keccak256(
            "Prediction(address user,uint256 marketId,string side,uint256 stakeWei,uint16 oddsBps,string uri,uint256 timestamp)"
        );

    // -------------------------
    // DATA
    // -------------------------
    struct Prediction {
        address user;
        uint256 marketId;
        string side;
        uint256 stakeWei;
        uint16 oddsBps;
        string uri;
        uint256 timestamp;
    }

    mapping(bytes32 => Prediction) public predictions;

    uint16 public immutable feeBps;
    address public immutable treasury;

    // -------------------------
    // EVENTS
    // -------------------------
    event PredictionPlaced(
        address indexed user,
        uint256 indexed marketId,
        bytes32 indexed id,
        string side,
        uint256 stakeWei,
        uint16 oddsBps,
        string uri,
        uint256 timestamp
    );

    event FeesWithdrawn(address to, uint256 amount);

    event ContractPaused(address account);
    event ContractUnpaused(address account);

    // -------------------------
    // CONSTRUCTOR
    // -------------------------
    constructor(
        address _admin,
        address _treasury,
        uint16 _feeBps,
        string memory name,
        string memory version
    ) {
        require(_admin != address(0), "zero-admin");
        require(_treasury != address(0), "zero-treasury");
        require(_feeBps <= 1000, "fee-too-high");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _treasury);

        treasury = _treasury;
        feeBps = _feeBps;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                block.chainid,
                address(this)
            )
        );
    }

    // -------------------------
    // PREDICTION
    // -------------------------
    function placePrediction(
        uint256 marketId,
        string calldata side,
        uint256 stakeWei,
        uint16 oddsBps,
        string calldata uri
    ) external payable whenNotPaused nonReentrant returns (bytes32 id) {
        uint256 expectedFee = (stakeWei * feeBps) / 10000;
        require(msg.value == expectedFee, "incorrect-fee");

        uint256 timestamp = block.timestamp;

        id = keccak256(
            abi.encode(
                PREDICTION_TYPEHASH,
                msg.sender,
                marketId,
                keccak256(bytes(side)),
                stakeWei,
                oddsBps,
                keccak256(bytes(uri)),
                timestamp
            )
        );

        predictions[id] = Prediction({
            user: msg.sender,
            marketId: marketId,
            side: side,
            stakeWei: stakeWei,
            oddsBps: oddsBps,
            uri: uri,
            timestamp: timestamp
        });

        emit PredictionPlaced(
            msg.sender,
            marketId,
            id,
            side,
            stakeWei,
            oddsBps,
            uri,
            timestamp
        );
    }

    // -------------------------
    // PAUSE/UNPAUSE
    // -------------------------
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    // -------------------------
    // WITHDRAW FEES
    // -------------------------
    function withdrawFees(address payable to, uint256 amount)
        external
        onlyRole(TREASURY_ROLE)
        nonReentrant
    {
        require(to != address(0), "zero");
        require(amount <= address(this).balance, "insufficient");

        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer-failed");

        emit FeesWithdrawn(to, amount);
    }
}
