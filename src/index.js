// Welcome to Unicrow SDK Tutorial!
//
// Follow and edit this file section-by-section to learn about the functionalities of Unicrow.
// Return to your browser to execute each action.
//
// The SDK (and thus this tutorial) works with Arbitrum mainnet by default. 
// Go all the way to the bottom of this code to change network configuration to connect to a testnet
//
// Pre-requisites: 
// - Four web3 wallet accounts for simulating a buyer, seller, arbitrator, and a marketplace
// - ETH and payment tokens on a selected network 

//
// Note: The SDK is by default configured to work with Arbitrum One network. To use one of the testnets, 
//       continue reading from line 668 of this file

import unicrowSdk from "@unicrowio/sdk"

// CONFIGURE NETWORK
// 
// It is necessary to configure which network the SDK should connect to. 
//
// Unicrow supports the following networks
// - 42161: Arbitrum One
// - 8453: Base
// - 421614: Arbitrum Sepolia
// - 84532: Base Sepolia

unicrowSdk.config({
  chainId: 42161,  // Edit for a different network
  autoSwitchNetwork: true         // This indicates whether functions interacting with the contract should switch the wallet to the default network automatically if a non-default network is selected
});


window.onload = async () => {

  // Edit and test the sections below one-by-one. 
  // Each step indicates which party should run it (i.e. which wallet account should be connected when pressing each button)


  // 1 PAYMENT AND RELEASE
  //
  // Shows how to process a payment and have it released by the buyer manually

  // 1.1 Buyer: Pay to a seller

  // setAction is just a local helper function used in this tutorial
  setAction("btn-1-1", async () => {
    // this is the first Unicrow SDK call
    await unicrowSdk.ui.pay({                 // EDIT BELOW and then press "Pay" in the browser as a buyer
      amount: 0.001,                          // Amount in ETH
      seller: "",                             // Paste the address of your testing seller account
      challengePeriod: ONE_DAY_IN_SEC * 14,   // two-week challenge period
    }, {
      confirmed: (payload) => {
        // confirmed callback returns the escrow data from the contract, including escrowId,
        // which is used throghought the payment's lifecycle
        document.getElementById("escrowid-1-1").innerHTML = payload.escrowId
        document.getElementById("1-pay-release").src = "img/1-1-Pay.png"
      }
    })
  }, "output-1-1")


  // 1.2 Buyer: Release the payment from the escrow
  //
  // If the buyer is satisfied with the trade outcome, they can release the payment to the seller

  setAction("btn-1-2", async () => {
    
    await unicrowSdk.ui.release(1,     // EDIT HERE: replace this with the Escrow ID returned in the previous step
      {
        confirmed: (payload) => {
          document.getElementById("waiting-1-2").style.display = "none"
          document.getElementById("confirmed-1-2").style.display = "block"

          document.getElementById("1-pay-release").src = "img/1-2-Release.png"
        }
      })
  }, "output-1-2")



  // 2 MARKETPLACE INTEGRATION
  //
  // Platforms integrating Unicrow can process payments and charge fees 
  //  without holding custody of the payments or exposing the funds to attacks and fraud.
  // The platform simply provides their address and their fee when creating the checkout payment.
  // The fee is sent to the marketplace's address during the release or claim process

  // 2.1 Buyer: Pay with a marketplace fee
  //
  // Using more fields this time to try more of the platform's features

  const marketplacePaymentData = {  // EDIT BELOW
    amount: 10,                     // Amount in token
    seller: "",                     // Set the seller address
    tokenAddress: "",               // Payment token address (addresses of selected ERC20 tokens at the very bottom)
    challengePeriod: 1,             // Recommended to keep the challenge period to one second to test claim function immediately
    marketplaceFee: 10,             // Marketplace fee in %
    marketplace: "",                // Paste an address of your test marketplace account
    paymentReference: ""            // Type in a text reference (e.g. order ID) to identify the payment 
  }

  // Using more callbacks to provide more granular status updates and information
  const detailedCallbacks = {
    connectingWallet: () => {
      document.getElementById("status-2-1").innerHTML = "Connecting wallet"
    },
    broadcasting: () => {
      document.getElementById("status-2-1").innerHTML = "Signing and broadcasting"
    },
    broadcasted: (payload) => {
      document.getElementById("status-2-1").innerHTML = "Payment sent!"
      document.getElementById("txhash-2-1").innerHTML = payload.transactionHash
      document.getElementById("buyer-2-1").innerHTML = payload.buyer
    },
    confirmed: (payload) => {
      document.getElementById("status-2-1").innerHTML = "Payment Confirmed!"

      document.getElementById("escrowid-2-1").innerHTML = payload.escrowId
      document.getElementById("marketplace-2-1").innerHTML = payload.marketplace
      document.getElementById("marketplace-fee-2-1").innerHTML = payload.marketplaceFee + "%"
      document.getElementById("payment-reference-2-1").innerHTML = payload.paymentReference

      document.getElementById("2-Marketplace").src = "img/2-1-Pay.png"

      // see all the returned data in the console
      console.log(payload)
    },
  }

  // Most Unicrow's functions can be called either via modals that provide the necessary UI elements 
  //   so you don't have to implement them yourself, or directly from your UI for more embedded experience. 
  // The functions calling modals are in "ui" package, their non-modal equivalents are in "core" package.
  // The rest of the tutorial follows this pattern by providing both options where applicable

  // Pay with modal
  setAction("btn-2-1-m", async () => {
    await unicrowSdk.ui.pay(marketplacePaymentData, detailedCallbacks)
  }, "output-2-1")

  // Pay without modal
  setAction("btn-2-1", async () => {
    await unicrowSdk.core.pay(marketplacePaymentData, detailedCallbacks)
  }, "output-2-1")


  // 2.2 Seller or marketplace: Claim the payment
  //
  // To save everyone's gas costs, claiming the payment sends all shares from the escrow wallet 
  //   to all eligible parties - in this case the seller and the marketplace.
  // Therefore, the claim functions can be called by either the seller or the marketplace 

  const claimCallback = {
    broadcasted: () => {
      display("output-2-2")
    },
    confirmed: async (payload) => {
      const escrow = await unicrowSdk.core.getEscrowData(payload.escrowId)
      const denominator = Math.pow(10, escrow.token.decimals)

      document.getElementById("claimed-seller").innerHTML = payload.amountSeller / denominator + " " + escrow.token.symbol
      document.getElementById("claimed-marketplace").innerHTML = payload.amountMarketplace / denominator + " " + escrow.token.symbol

      if (escrow.connectedUser == "seller") {
        document.getElementById("2-Marketplace").src = "img/2-2-Claim-Seller.png"
      } else if (escrow.connectedUser == "marketplace") {
        document.getElementById("2-Marketplace").src = "img/2-2-Claim-Marketplace.png"
      }
    }
  }

  // Don't forget to switch your wallet to seller or marketplace account

  // Claim with modal
  setAction("btn-2-2-m", async () => {
    await unicrowSdk.ui.claim(99999999,   // EDIT HERE: Escrow ID from the previous step
      claimCallback)
  })

  // Claim without modal
  setAction("btn-2-2", async () => {
    await unicrowSdk.core.claim(99999999, // EDIT HERE: Escrow ID from the previous step
      claimCallback)
  })



  // 3 ARBITRATION
  //
  // To resolve disputes between buyers and seller, an arbitrator can be defined for the escrow upfront.
  // The arbitrator can decide only between the buyer and the seller, they cannot freeze the escrow, or move the funds elsewhere. 
  // Even if an arbitrator becomes unresponsive, the escrow can still be claimed by the seller (after the challenge
  //   period ends) or released by the buyer.
  // This way, the arbitrator doesn't hold even a partial custody of the escrowed funds, nor puts the funds at risk


  // 3.1 Payment with an arbitrator

  // As usual start with the payment.
  const arbitrationPayment = {            // EDIT BELOW
    amount: 0,
    seller: "",
    tokenAddress: "",
    challengePeriod: ONE_DAY_IN_SEC * 14,
    //marketplace: "",                    // optionally uncomment and set a marketplace address and fee
    //marketplaceFee: ,
    arbitrator: "",                       // arbitrator address
    arbitratorFee: 0,                     // arbitrator fee (in %)
  }

  const arbitrationPaymentCallbacks = {
    confirmed: (payload) => {
      document.getElementById("escrowid-3-1").innerHTML = payload.escrowId;
      document.getElementById("arbitrator-3-1").innerHTML = payload.arbitrator;
      document.getElementById("arbitrator-fee-3-1").innerHTML = payload.arbitratorFee + "%";

      document.getElementById("3-arbitration").src = "img/3-1-Pay.png"
    },
  }

  setAction("btn-3-1-m", async () => {
    await unicrowSdk.ui.pay(arbitrationPayment, arbitrationPaymentCallbacks);
  }, "output-3-1")

  setAction("btn-3-1", async () => {
    await unicrowSdk.core.pay(arbitrationPayment, arbitrationPaymentCallbacks);
  }, "output-3-1")


  // 3.2 Arbitrate the payment
  // 
  // Connect the arbitrator's account to arbitrate the payment

  const arbitrateCallbacks = {
    broadcasted: (payload) => {
      // If the arbitration is called via modal, the user inputs the buyer and seller share values. 
      // In such a case, it's useful to read them back from the function. This callback returns them
      document.getElementById("buyer-share-3-2").innerHTML = payload.splitBuyer + "%"
      document.getElementById("seller-share-3-2").innerHTML = payload.splitSeller + "%"
      
      var arbitrationImage = "img/3-2-";
      if (payload.splitBuyer == 0) {
        arbitrationImage += "Release"
      } else if (payload.splitBuyer < 100) {
        arbitrationImage += "Settle"
      } else {
        arbitrationImage += "Refund"
      }
      document.getElementById("3-arbitration").src = arbitrationImage += ".png"
    },
    confirmed: async (payload) => {
      const token = await unicrowSdk.core.getTokenInfo(payload.tokenAddress)
      const denominator = Math.pow(10, token.decimals)

      document.getElementById("buyer-3-2").innerHTML = payload.amountBuyer / denominator + " " + token.symbol
      document.getElementById("seller-3-2").innerHTML = payload.amountSeller / denominator + " " + token.symbol
      document.getElementById("marketplace-3-2").innerHTML = payload.amountMarketplace / denominator + " " + token.symbol
      document.getElementById("arbitrator-3-2").innerHTML = payload.amountArbitrator / denominator + " " + token.symbol
      document.getElementById("protocol-3-2").innerHTML = payload.amountProtocol / denominator + " " + token.symbol
    }
  }


  // The modal displays a form with which the arbitrator can split the payment 
  setAction("btn-3-2-m", async () => {
    await unicrowSdk.ui.arbitrate(99999999,  // EDIT HERE: Escrow Id
      arbitrateCallbacks)
  }, "output-3-2")

  // When calling the arbitration function directly, it is necessary to provide the splits in the call
  setAction("btn-3-2", async () => {
    await unicrowSdk.core.arbitrate(  // EDIT BELOW
      99999999,                       // Escrow Id
      0,                              // Buyer share (0 to release to seller, 100 to refund to buyer, anything in between to settle between them)
      0,                              // Seller share (buyer + seller share must equal 100)
      arbitrateCallbacks)
  }, "output-3-2")

  // NOTE: In this case, we added the arbitrator upfront. If, however, there was no arbitrator specified at the time 
  //       of the payment, it is still possible to add one by a mutual buyer/seller consensus using 
  //       ui.addApproveArbitrator() or core.proposeArbitrator() and core.approveArbitrator() functions
  


  // 4 CHALLENGE A PAYMENT
  //
  // If the buyer is not satisfied and they can't agree with the seller on a refund, 
  // they can challenge the payment within the pre-defined period

  // 4.1 Buyer: Pay to a seller
  //
  // Make a new payment to test the challenge

  const challengeCallbacks = {
    confirmed: (payload) => {
      document.getElementById("escrowid-4-1").innerHTML = payload.escrowId
      document.getElementById("paid-4-1").innerHTML = payload.paidAt
      document.getElementById("cp-end-4-1").innerHTML = payload.challengePeriodEnd

      document.getElementById("4-challenge").src = "img/4-1-Pay.png"
    },
  }

  const paymentInfo = {   // EDIT BELOW
    amount: 0,
    seller: "",
    tokenAddress: "",
    challengePeriod: ONE_DAY_IN_SEC * 14,
    challengePeriodExtension: ONE_DAY_IN_SEC * 7  // setting this to see how it works
  }

  // Pay with modal 
  setAction("btn-4-1-m", async () => {
    await unicrowSdk.ui.pay(paymentInfo, challengeCallbacks)
  }, "output-4-1")

  // Pay without modal
  setAction("btn-4-1", async () => {
    await unicrowSdk.core.pay(paymentInfo, challengeCallbacks)
  }, "output-4-1")


  // 4.2 Buyer: Challenge the Payment

  // The challenge function returns the payment data including new challenge period information in its callback. Display some of them here
  const challengeCallback = {
    broadcasted: (payload) => {
      display("output-4-2")
    },
    confirmed: (payload) => {
      display("seller-challenge-4-2")
      display("buyer-claim-4-2")

      document.getElementById("challengeperiodstart-4-2").innerHTML = payload.challengePeriodStart.toString()
      document.getElementById("challengeperiodend-4-2").innerHTML = payload.challengePeriodEnd.toString()

      document.getElementById("4-challenge").src = "img/4-2-Challenge.png"
    }
  }

  setAction("btn-4-2-m", async () => {
    await unicrowSdk.ui.challenge(99999999, // EDIT HERE: replace with the Escrow ID returned from the previous step
      challengeCallback);
  })

  setAction("btn-4-2", async () => {
    await unicrowSdk.core.challenge(99999999,  // EDIT HERE: replace with the Escrow ID returned from the previous step
      challengeCallback);
  })

  // NOTE: Optionally, you can now call the ui.challenge() function for this escrow from the seller's account to 
  //       see how the challenge periods work (a new one starts after the current one ends)

  // NOTE: To avoid reputation damage, the seller can simply call ui.refund() or core.refund() to fully refund the payment 
  //       to the buyer (no protocol or other fees are charged in such a case)


  // 5 Settlement
  //
  // One of the ways to get out of a dispute is for the buyer and the seller to agree on a settlement - in other words by a seller agreeing on a discount for the buyer
  //
  // The buyer and seller have to agree on the settlement on-chain, i.e. both of them must send identical settlement offer. 
  // If the contract finds the offers match, it sends the respective shares to both seller and the buyer


  // 5.1 Payment
  //
  // As usual, start by sending a new payment

  const settlementPaymentData = {           // EDIT BELOW
    amount: 0,                              // amount in token
    seller: "",                             // Seller account address
    tokenAddress: "",                       // Payment token address
    challengePeriod: ONE_DAY_IN_SEC * 14,   // 2-week challenge period
    marketplaceFee: 10,                     // Recommended to keep the marketplace fee in the payment data to observe how fees behave for settled payments
    marketplace: ""                         // Marketplace address
  }

  const settlementPaymentCallbacks = {
    confirmed: (payload) => {
      document.getElementById("escrowid-5-1").innerHTML = payload.escrowId
      document.getElementById("amount-5-1").innerHTML = settlementPaymentData.amount.toString()
      document.getElementById("marketplace-fee-5-1").innerHTML = payload.splitMarketplace + "%"
      document.getElementById("protocol-fee-5-1").innerHTML = payload.splitProtocol + "%"
      document.getElementById("net-amount-5-1").innerHTML = ((100 - payload.splitMarketplace - payload.splitProtocol) * settlementPaymentData.amount / 100).toString()
      // Note, that the above might produce some inprecision at the 

      document.getElementById("5-Settlement").src = "img/5-1-Pay.png"
    }
  }

  // Pay with modal
  setAction("btn-5-1-m", async () => {
    await unicrowSdk.ui.pay(settlementPaymentData, settlementPaymentCallbacks)
  }, "output-5-1")

  // Pay without modal
  setAction("btn-5-1", async () => {
    await unicrowSdk.core.pay(settlementPaymentData, settlementPaymentCallbacks)
  }, "output-5-1")


  // 5.2 Buyer or Seller: Offer a settlement
  // 
  // Send the first offer from either buyer's or seller's account

  const settlementOfferCallbacks = {
    broadcasted: (payload) => {
      display("output-5-2")

      // If the inputs are provided by the user via modal, it might be useful to know what the user submitted.
      // For this purpose, the broadcasted callback returns the values
      document.getElementById("buyer-5-2").innerHTML = payload.splitBuyer + "%"
      document.getElementById("seller-5-2").innerHTML = payload.splitSeller + "%"
    },
    confirmed: async (payload) => {
      const escrow = await unicrowSdk.core.getEscrowData(payload.escrowId)

      if (payload.latestSettlementOfferAddress == escrow.buyer) {
        document.getElementById("5-Settlement").src = "img/5-2-Offer-Buyer.png"
      } else if (payload.latestSettlementOfferAddress == escrow.seller) {
        document.getElementById("5-Settlement").src = "img/5-2-Offer-Seller.png"
      }
    }
  }

  // When submitting an offer via modal, the user provides the inputs in the provided form. 
  // NOTE: this currently produces an error toast message on the front-end. 
  //       We'll get this fixed, but in the meantime know that the transaction goes through normally
  setAction("btn-5-2-m", async () => {
    await unicrowSdk.ui.settlementOffer(99999999,   // EDIT HERE: Escrow Id
      settlementOfferCallbacks)
  })

  // Without the modal, the settlement parameters (shares) need to be provided in the call
  setAction("btn-5-2", async () => {
    await unicrowSdk.core.offerSettlement(   // EDIT BELOW
      99999999,                              // Escrow Id
      0,                                     // Buyer share in % (how much should the buyer get back)
      0,                                     // Seller share (buyer+seller share must be equal to 100)
      settlementOfferCallbacks)
  })


  // 5.3 Get settlement offer information
  //
  // The latest settlement offer information can be read from the contract
  // In this example, the information is used to calculate how much would each party receive if the offer is accepted as is
  setAction("btn-5-3", async () => {
    const result = await unicrowSdk.core.getEscrowData(99999999)  // EDIT HERE
    // this function calculates how much will each party receive from the escrow amount in a defined scenario.
    const amounts = unicrowSdk.core.calculateAmounts({
      amount: result.amount,
      splitBuyer: result.settlement.latestSettlementOfferBuyer,
      splitSeller: result.settlement.latestSettlementOfferSeller,
      splitProtocol: result.splitProtocol,
      splitMarketplace: result.splitMarketplace,
    });

    const tokenSymbol = result.token.symbol
    const tokenDecimals = result.token.decimals;

    document.getElementById("offered-5-3").innerHTML = result.settlement.latestSettlementOfferAddress == result.buyer ? "Buyer" : "Seller";;
    document.getElementById("buyer-share-5-3").innerHTML = convertWei(amounts.amountBuyer, tokenDecimals) + " " + tokenSymbol + "<br><em>(Buyer always gets a full share unless the payment is settled by the arbitrator)</em>"
    document.getElementById("seller-share-5-3").innerHTML = convertWei(amounts.amountSeller, tokenDecimals) + " " + tokenSymbol + "<br><em>(Fees are deducted from seller's share)</em>"
    document.getElementById("marketplace-share-5-3").innerHTML = convertWei(amounts.amountMarketplace, tokenDecimals) + " " + tokenSymbol
    document.getElementById("unicrow-share-5-3").innerHTML = convertWei(amounts.amountProtocol, tokenDecimals) + " " + tokenSymbol + "<br><em>(Fees are reduced proportionally to the seller's share)</em>"
  }, "output-5-3")


  // 5.4 Seller or Buyer: Review and accept the offer
  //
  // Don't forget to switch to another account (seller if the offer in 5.2 was made by the buyer, and vice versa)
  const acceptOfferCallbacks = {
    broadcasted: () => {
      // document.getElementById("output-5-4").style.display = "block"
      document.getElementById("message-5-4").innerHTML = "<strong>Approval Sent</strong>"
    },
    confirmed: async (payload) => {
      console.log(payload)
      if (payload.name == "ApproveOffer") {
        const tokenInfo = await unicrowSdk.core.getTokenInfo(payload.tokenAddress)
        const denominator = Math.pow(10, tokenInfo.decimals)
        const symbol = tokenInfo.symbol

        document.getElementById("message-5-4").innerHTML = "<strong>Payment Settled!</strong>"
        display("claimed-info-5-4")
        document.getElementById("seller-claim-5-4").innerHTML = payload.amountSeller / denominator + " " + symbol
        document.getElementById("buyer-claim-5-4").innerHTML = payload.amountBuyer / denominator + " " + symbol
        document.getElementById("marketplace-claim-5-4").innerHTML = payload.amountMarketplace / denominator + " " + symbol
        document.getElementById("protocol-claim-5-4").innerHTML = payload.amountProtocol / denominator + " " + symbol

        const connectedAccount = (await unicrowSdk.wallet.getCurrentWalletAddress()).toString()

        if (unicrowSdk.helpers.isSameAddress(connectedAccount, payload.buyer)) {
          document.getElementById("5-Settlement").src = "img/5-4-Accept-Buyer.png"
        } else if (unicrowSdk.helpers.isSameAddress(connectedAccount, payload.seller)) {
          document.getElementById("5-Settlement").src = "img/5-4-Accept-Seller.png"
        }
      }
    }
  };

  // To accept the offer, call this function with the account of the other party than the one which sent the offer 
  // (i.e. if the offer was made by the seller, call this as a buyer and vice versa)

  // The modal reads and displays the latest settlement offer, lets the user take appropriate action, and submits the data
  setAction("btn-5-4-m", async () => {
    await unicrowSdk.ui.settlementOffer(99999999, acceptOfferCallbacks)   // EDIT HERE
  }, "output-5-4")

  // When using the settlement without modal, it is necessary to provide that data.  
  setAction("btn-5-4", async () => {
    await unicrowSdk.core.approveSettlement(   // EDIT BELOW
      99999999,                                // Escrow ID
      0,                                       // Buyer share
      0,                                       // Seller share
      acceptOfferCallbacks
    )
  }, "output-5-4")


  // 6 Indexer

  // We'll demonstrate indexer integration by listing the payments and claiming user's balance

  // Deploying your local Unicrow indexer is extremely simple.
  // Check it out at https://github.com/unicrowio/indexer and follow the step-by-step guide
  // 
  // When you run the indexer successfully, it should be accessible at this url below
  
  const GRAPHQL_ENDPOINT = "";

  // 6.1 Buyer: Prepare payments

  setAction("btn-6-1", async () => {
    const result = await unicrowSdk.core.pay({ // EDIT BELOW
        amount: 0,
        seller: "",
        tokenAddress: "",
        // marketplace: "",
        // marketplaceFee: 0,
        // arbitrator: "",
        // arbitratorFee: 0,
        challengePeriod: 1,
      },
      {
        connectingWallet: () => {
          document.getElementById("result-6-1").innerHTML = "Connecting and broadcasting"
        },
        confirmed: () => {
          document.getElementById("result-6-1").innerHTML = "Confirmed!"
        },
      }
    ); 
  }, "output-6-1")
  // Re-run the above a few times with both long (e.g. 1 week) and short (1 sec) challenge period,
  //   and optionally with different payment tokens (or ETH) and amounts


  // 6.2 List the payments

  setAction("btn-6-2", async() => {
    const indexerInstance = unicrowSdk.indexer.getInstance(GRAPHQL_ENDPOINT);

    const connectedAccount = await unicrowSdk.wallet.getCurrentWalletAddress()
    const chainId = (await unicrowSdk.wallet.getNetwork()).chainId
    
    const result = await indexerInstance.getPaymentList(
      {
        // Search for payments where the connected user is either seller OR buyer
        // network: unicrowSdk
        chainId,
        seller: connectedAccount,
        buyer: connectedAccount
      }, { 
        limit: 20, 
        page: 1
      }
    )

    document.getElementById("output-6-2").innerHTML = convertResultToJson(result)
  }, "output-6-2")


  // 6.3 Seller: View Balance

  document.getElementById("btn-6-3").onclick = async () => {
    const indexerInstance = unicrowSdk.indexer.getInstance(GRAPHQL_ENDPOINT);

    const connectedAccount = (await unicrowSdk.wallet.getCurrentWalletAddress()).toString()
    const chainId = (await unicrowSdk.wallet.getNetwork()).chainId

    const result = await indexerInstance.getUserBalance(connectedAccount, chainId)
    
    display("output-6-3")

    document.getElementById("output-6-3").innerHTML = convertResultToJson(result)
  };

  // 6.4 Seller: Claim Balance
  setAction("btn-6-4", async () => {
    const indexerInstance = unicrowSdk.indexer.getInstance(GRAPHQL_ENDPOINT);

    const connectedAccount = (await unicrowSdk.wallet.getCurrentWalletAddress()).toString()
    const chainId = (await unicrowSdk.wallet.getNetwork()).chainId

    // get user's balance to display it in the claim modal
    const balance = await indexerInstance.getUserBalance(connectedAccount, chainId)
 
    // get list of escrow wallets, that are ready to claim
    const escrowsToClaim = await indexerInstance.getClaimableEscrows(connectedAccount, chainId)

    console.log(balance)
    console.log(escrowsToClaim)

    const result = await unicrowSdk.ui.claimMultiple(escrowsToClaim, balance, {
      connectingWallet: () => {
        document.getElementById("status-6-4").innerHTML = "Connecting"
      },
      broadcasting: () => {
        document.getElementById("status-6-4").innerHTML = "Broadcasting";
      },
      broadcasted: () => {
        document.getElementById("status-6-4").innerHTML = "Broadcasted"
      },
      confirmed: (payload) => {
        document.getElementById("status-6-4").innerHTML = "Confirmed"
      },
    })

    document.getElementById("result-6-4").innerHTML = convertResultToJson(result)
  }, "output-6-4")

  
  // THANK YOU for making it all the way here!
  //
  // If any of this went less than smoothly, please give us feedback at devs@unicrow.io or at https://discord.gg/9KTudepHQk
  // 
  // If you love what we've built, please give us a shoutout at https://twitter.com/unicrowio, or let us know at our 
  //   Discord how are you thinking of using the platform
  //
  // You can also check out more documentation at https://docs.unicrow.io and review the SDK, contracts, and indexer 
  //   source code at https://github.com/orgs/unicrowio/repositories 
  

  // SANDBOX

  // Below, find a small Sandbox code that is more versatile to use for your further testing
  // Run the code by pressing the "Execute" button at the very bottom of the tutorial page in the Sandbox section

  const sandboxCallbacks = {
    connected: (payload) => {
      console.log(payload)
    },
    confirmed: (payload) => {
      console.log("confirmed")
      document.getElementById("output-sandbox").innerHTML = `<pre style="text-align: left;">` + convertResultToJson(payload) + `</pre>`
    }
  }

  setAction("btn-sandbox", async() => {
    const paymentInfo = {
      // buyer: "",
      seller: "",
      tokenAddress: "",
      amount: 10,
      challengePeriod: 1,
      marketplace: "",
      marketplaceFee: 10,
      arbitrator: "",
      arbitratorFee: 0,
      paymentReference: ""
    }
    
    // await unicrowSdk.core.pay(paymentInfo, sandboxCallbacks)
  }, "output-sandbox")
}

const ONE_DAY_IN_SEC = 86400

// Arbitrum One addresses of the most popular stablecoins
const daiArbitrumAddress = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
const usdcArbitrumAddress = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
const usdtArbitrumAddress = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"

const usdcBaseAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const usdcBaseSepoliaAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"


// HELPER FUNCTIONS

function setAction(button, action, output) {
  document.getElementById(button).onclick = async () => {
    // Display a placeholder for escrowId when the user presses the button
    if (output != null) {
      document.getElementById(output).style.display = "block"
    }

    action()
  }
}

function convertWei(amount, decimals) {
  return Number(amount) / Math.pow(10, decimals);
}

function display(id) {
  document.getElementById(id).style.display = "block"
}

function convertResultToJson(result) {
  const replacer = (key, value) =>
    typeof value === 'bigint'
        ? value.toString()
        : value
        
  return JSON.stringify(result, replacer, 2);
}