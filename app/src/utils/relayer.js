import { RELAYER_ENDPOINT, RELAYER_ADDRESS, DEADLINE, DAI_CONTRACT, GASLESS_CONTRACT, EXCHANGE_CONTRACT, CHAIN_ID } from "./constants"
import axios from 'axios'
import {ethers} from 'ethers'
const api = axios.create({
    baseURL: RELAYER_ENDPOINT,
    timeout: 10000,
});

const EIP712Domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
];
const domain = {
    name: "Gasless by Mosendo",
    version: "1",
    chainId: parseInt(CHAIN_ID),
    verifyingContract: GASLESS_CONTRACT
};

function approve (from, web3) {
    return new Promise(async (resolve, reject) => {
        const abi = [
            "function nonces(address) view returns (uint256)",
        ];
        const provider = new ethers.providers.Web3Provider(web3.currentProvider);
        const contract = new ethers.Contract(DAI_CONTRACT, abi, provider);
        let nonce;
        try {
            nonce = (await contract.nonces(from)).toNumber();
        } catch(e) {
            reject(e)
            return
        }
        const deadline = Math.floor(Date.now() / 1000) + DEADLINE;
    
        const Permit = [
            { name: "holder", type: "address" },
            { name: "spender", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "expiry", type: "uint256" },
            { name: "allowed", type: "bool" }
        ];
        const EIP712Domain = [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
        ];
        const domain = {
            name: "Dai Stablecoin",
            version: "1",
            chainId: parseInt(CHAIN_ID),
            verifyingContract: DAI_CONTRACT
        };
    
        var message = {
            holder: from,
            spender: GASLESS_CONTRACT,
            nonce,
            expiry: deadline,
            allowed: true
        };
    
        const data = JSON.stringify({
            types: {
                EIP712Domain,
                Permit
            },
            domain,
            primaryType: "Permit",
            message
        });
        web3.currentProvider.sendAsync({
            method: "eth_signTypedData_v3",
            params: [from, data],
            from
        }, async (e, r) => {
            if(e) {
                reject(e)
                return
            }
            const sig = r.result;
            try {
                const res = await api({
                    method: 'post',
                    url: '/approve',
                    data: {
                        from,
                        nonce,
                        deadline,
                        sig
                    }
                })
                const interval = setInterval(async ()=>{
                    const receipt = await provider.getTransactionReceipt(res.data.result)
                    if(receipt) {
                        clearInterval(interval);
                        if(receipt.status === 1) resolve()
                        else reject("Transaction reverted: "+JSON.stringify(receipt))
                    }
                },3000)
            } catch(e) {
                reject(e.response.data.errorMessage)
            }
        })
    })
}

async function getSwapRate (dai_sold, web3) {
    const abi = [
        "function getTokenToEthInputPrice(uint256) view returns (uint256)",
    ];
    const provider = new ethers.providers.Web3Provider(web3.currentProvider);
    const contract = new ethers.Contract(EXCHANGE_CONTRACT, abi, provider);
    return (await contract.getTokenToEthInputPrice(dai_sold)).toString();
}

function swap(from, dai_sold, min_eth, fee, gasprice, web3, {sig, deadline, nonce} = {}) {
    return new Promise(async (resolve, reject) => {
        if(!deadline) deadline = Math.floor(Date.now() / 1000) + DEADLINE;
        if(!nonce) nonce = await getNonce(from);
        if(!sig) {
            const Swap = [
                { name: "relayer", type: "address" },
                { name: "dai_sold", type: "uint256" },
                { name: "min_eth", type: "uint256" },
                { name: "fee", type: "uint256" },
                { name: "gasprice", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ];
        
            var message = {
                relayer: RELAYER_ADDRESS,
                dai_sold,
                min_eth,
                fee,
                gasprice,
                nonce,
                deadline
            };
        
            const data = JSON.stringify({
                types: {
                    EIP712Domain,
                    Swap
                },
                domain,
                primaryType: "Swap",
                message
            });
            web3.currentProvider.sendAsync({
                method: "eth_signTypedData_v3",
                params: [from, data],
                from
            }, async (e, r) => {
                if(e) {
                    reject(e)
                    return
                }
                const sig = r.result;
                try {
                    const res = await api({
                        method: 'post',
                        url: '/swap',
                        data: {
                            dai_sold,
                            min_eth,
                            fee,
                            gasprice,
                            nonce,
                            deadline,
                            sig
                        }
                    })
                    resolve(res.data.result)
                } catch(e) {
                    if(e.response.data.errorMessage === "Address has not permitted our contract using MCD. Permit function must be called first.") {
                        try {
                            await approve(from, web3)
                        } catch(e) {
                            reject(new Error("APPROVE: "+JSON.stringify(e, null, 2)))
                        }
                        setTimeout(async ()=>{
                            resolve(await swap(from, dai_sold, min_eth, fee, gasprice, web3, {sig, deadline, nonce}))
                        },200)
                    } else {
                        reject(new Error(e.response.data.errorMessage))
                    }                
                }
            })
        } else {
            let res;
            try {
                res = await api({
                    method: 'post',
                    url: '/send',
                    data: {
                    to,
                    value,
                    fee,
                    gasprice,
                    deadline,
                    nonce,
                    sig
                    }
                })
                resolve(res.data.result)
            } catch(e) {
                reject(new Error(e.response.data.errorMessage))
            }
        }
    })
}

function send (from, to, value, fee, gasprice, web3, {sig, deadline, nonce} = {}) {
    return new Promise(async (resolve, reject) => {
        if(!deadline) deadline = Math.floor(Date.now() / 1000) + DEADLINE;
        if(!nonce) nonce = await getNonce(from);
        if(!sig) {
            const Send = [
                { name: "relayer", type: "address" },
                { name: "to", type: "address" },
                { name: "value", type: "uint256" },
                { name: "fee", type: "uint256" },
                { name: "gasprice", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ];
        
            var message = {
                relayer: RELAYER_ADDRESS,
                to,
                value,
                fee,
                gasprice,
                nonce,
                deadline
            };
        
            const data = JSON.stringify({
                types: {
                    EIP712Domain,
                    Send
                },
                domain,
                primaryType: "Send",
                message
            });
            web3.currentProvider.sendAsync({
                method: "eth_signTypedData_v3",
                params: [from, data],
                from
            }, async (e, r) => {
                if(e) {
                    reject(e)
                    return
                }
                const sig = r.result;
                try {
                    const res = await api({
                        method: 'post',
                        url: '/send',
                        data: {
                            to,
                            value,
                            fee,
                            gasprice,
                            nonce,
                            deadline,
                            sig
                        }
                    })
                    resolve(res.data.result)
                } catch(e) {
                    if(e.response.data.errorMessage === "Address has not permitted our contract using MCD. Permit function must be called first.") {
                        try {
                            await approve(from, web3)
                        } catch(e) {
                            reject(new Error("APPROVE: "+JSON.stringify(e, null, 2)))
                        }
                        setTimeout(async ()=>{
                            resolve(await send(from, to, value, fee, gasprice, web3, {sig, deadline, nonce}))
                        },200)
                    } else {
                        reject(new Error(e.response.data.errorMessage))
                    }                
                }
            })
        } else {
            let res;
            try {
                res = await api({
                    method: 'post',
                    url: '/send',
                    data: {
                    to,
                    value,
                    fee,
                    gasprice,
                    deadline,
                    nonce,
                    sig
                    }
                })
                resolve(res.data.result)
            } catch(e) {
                reject(new Error(e.response.data.errorMessage))
            }
        }
    })
    
}

async function getFee(type, web3) {
    const gasprice = (await web3.eth.getGasPrice()).toString();
    try {
        const res = await api({
            method: 'post',
            url: '/getFee',
            data: {
            type,
            gasprice
            }
        })
        return {
            fee:res.data.result,
            gasprice
        }
    } catch(e) {
        throw new Error(e.response.data.errorMessage)
    }
}

async function getNonce(address) {
    try {
        const res = await api({
            method: 'post',
            url: '/getNonce',
            data: {
            address
            }
        })
        return res.data.result
    } catch(e) {
        throw new Error(e.response.data.errorMessage)
    }
}

export default {
    send,
    swap,
    getFee,
    getSwapRate
}