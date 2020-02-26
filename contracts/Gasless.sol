pragma solidity 0.5.12;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

interface MCD {
    function approve(address usr, uint wad) external returns (bool);
    function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) external;
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
}

interface ICHAI {
    function dai(address usr) external returns (uint);
    function approve(address usr, uint wad) external returns (bool);
    function move(address src, address dst, uint wad) external returns (bool);
    function join(address dst, uint wad) external;
    function draw(address src, uint wad) external;
}

contract Gasless {
    using SafeMath for uint;

    MCD MCDContract;
    ICHAI ICHAIContract;

    address relayer;

    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant SEND_TYPEHASH = keccak256(
        "Send(address to,uint256 value,uint256 nonce,uint256 fee,uint256 deadline,address relayer,uint256 gasprice)"
    );
    bytes32 public constant JOIN_TYPEHASH = keccak256(
        "Join(uint256 value,uint256 nonce,uint256 fee,uint256 deadline,address relayer,uint256 gasprice)"
    );
    bytes32 public constant EXIT_TYPEHASH = keccak256(
        "Exit(address to,uint256 value,uint256 nonce,uint256 fee,uint256 deadline,address relayer,uint256 gasprice)"
    );
    bytes32 public constant EXIT_ALL_TYPEHASH = keccak256(
        "ExitAll(address to,uint256 nonce,uint256 fee,uint256 deadline,address relayer,uint256 gasprice)"
    );

    event RelayerChange(address newRelayer);

    mapping (address => uint256) public nonces;

    modifier onlyRelayer () {
        require(msg.sender == relayer, "Only the relayer address is authorized to send this tx");
        _;
    }

    constructor(address initialRelayer, address MCDaddress, address ICHAIaddress, uint chainId) public {
        MCDContract = MCD(MCDaddress);
        ICHAIContract = ICHAI(ICHAIaddress);
        relayer = initialRelayer;
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("Gasless by Mosendo"),
            keccak256(bytes("1")),
            chainId,
            address(this)
        ));
        approveChai();
    }

    function changeRelayer(address newRelayer) public onlyRelayer {
        relayer = newRelayer;
        emit RelayerChange(newRelayer);
    }

    function send(address to, uint value, uint nonce, uint fee, uint deadline, uint8 v, bytes32 r, bytes32 s) public onlyRelayer {
        require(block.timestamp <= deadline, "Deadline expired");
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(SEND_TYPEHASH,
                                     to,
                                     value,
                                     nonce,
                                     fee,
                                     deadline,
                                     relayer,
                                     tx.gasprice))
        ));
        address from = ecrecover(digest, v, r, s);
        require(nonce == nonces[from], "Invalid nonce");
        nonces[from]++;

        MCDContract.transferFrom(from, to, value.sub(fee));
        MCDContract.transferFrom(from, msg.sender, fee);
    }

    function join_chai(uint value, uint nonce, uint fee, uint deadline, uint8 v, bytes32 r, bytes32 s) public onlyRelayer {
        require(block.timestamp <= deadline, "Deadline expired");
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(JOIN_TYPEHASH,
                                     value,
                                     nonce,
                                     fee,
                                     deadline,
                                     relayer,
                                     tx.gasprice))
        ));
        address from = ecrecover(digest, v, r, s);
        require(nonce == nonces[from], "Invalid nonce");
        nonces[from]++;

        MCDContract.transferFrom(from, address(this), value.sub(fee));
        MCDContract.transferFrom(from, msg.sender, fee);
        ICHAIContract.join(from, value);
    }

    function exit_chai(address to, uint nonce, uint fee, uint deadline, uint8 v, bytes32 r, bytes32 s) public onlyRelayer {
        require(block.timestamp <= deadline, "Deadline expired");
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(EXIT_ALL_TYPEHASH,
                                     to,
                                     nonce,
                                     fee,
                                     deadline,
                                     relayer,
                                     tx.gasprice))
        ));
        address from = ecrecover(digest, v, r, s);
        require(nonce == nonces[from], "Invalid nonce");
        nonces[from]++;

        uint value = ICHAIContract.dai(from);
        ICHAIContract.draw(from, value);
        MCDContract.transfer(to, value.sub(fee));
        MCDContract.transfer(msg.sender, fee);
    }

    function draw_chai(address to, uint value, uint nonce, uint fee, uint deadline, uint8 v, bytes32 r, bytes32 s) public onlyRelayer {
        require(block.timestamp <= deadline, "Deadline expired");
        bytes32 digest = keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(EXIT_TYPEHASH,
                                     to,
                                     value,
                                     nonce,
                                     fee,
                                     deadline,
                                     relayer,
                                     tx.gasprice))
        ));
        address from = ecrecover(digest, v, r, s);
        require(nonce == nonces[from], "Invalid nonce");
        nonces[from]++;

        ICHAIContract.draw(from, value);
        MCDContract.transfer(to, value.sub(fee));
        MCDContract.transfer(msg.sender, fee);
    }

    function approveChai() public {
        MCDContract.approve(address(ICHAIContract), uint(-1)); // or 2**256-1
    }
}