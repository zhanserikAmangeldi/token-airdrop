// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Airdrop - supports owner multisend and Merkle-claim airdrop
contract Airdrop is Ownable {
    IERC20 public immutable token;

    bytes32 public merkleRoot;

    mapping(bytes32 => bool) public claimed;

    event Multisend(address indexed sender, uint256 total);
    event MerkleRootUpdated(bytes32 root);
    event Claimed(address indexed account, uint256 amount, bytes32 leaf);

    constructor(IERC20 token_) {
        token = token_;
    }

    /// @notice Owner transfers tokens from owner into this contract for later claims/sends
    /// Owner must approve the Airdrop contract first if using `depositFromOwner`
    function depositFromOwner(uint256 amount) external onlyOwner {
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
    }

    /// @notice Multisend: owner calls to distribute tokens directly (token must be in this contract or owner)
    function multisendFromContract(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "length mismatch");
        uint256 total = 0;
        for (uint i = 0; i < amounts.length; i++) total += amounts[i];

        for (uint i = 0; i < recipients.length; i++) {
            require(token.transfer(recipients[i], amounts[i]), "transfer failed");
        }
        emit Multisend(msg.sender, total);
    }

    /// @notice Simple multisend that pulls tokens from owner (owner must approve)
    function multisendFromOwner(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "length mismatch");
        uint256 total = 0;
        for (uint i = 0; i < amounts.length; i++) total += amounts[i];

        for (uint i = 0; i < recipients.length; i++) {
            require(token.transferFrom(msg.sender, recipients[i], amounts[i]), "transferFrom failed");
        }
        emit Multisend(msg.sender, total);
    }

    /// @notice Set Merkle root for claim-based airdrop
    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
        emit MerkleRootUpdated(root);
    }

    /// @notice Claim function for Merkle-tree based airdrop.
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata proof) external {
        // Recreate leaf node - MUST match how you generate leaves off-chain
        bytes32 leaf = keccak256(abi.encodePacked(index, account, amount));
        require(!claimed[leaf], "already claimed");
        require(_verify(proof, leaf), "invalid proof");

        claimed[leaf] = true;

        require(token.transfer(account, amount), "token transfer failed");
        emit Claimed(account, amount, leaf);
    }

    /// @dev Verify a Merkle proof
    function _verify(bytes32[] calldata proof, bytes32 leaf) internal view returns (bool) {
        bytes32 computed = leaf;
        for (uint i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computed <= proofElement) {
                computed = keccak256(abi.encodePacked(computed, proofElement));
            } else {
                computed = keccak256(abi.encodePacked(proofElement, computed));
            }
        }
        return computed == merkleRoot;
    }
}
