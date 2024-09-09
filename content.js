function parseDate(dateString) {
    // Parse date from string format "YYYY-MM-DDTHH:MM:SS" to "YYYY-MM-DD"
    // TODO: Backend should be able to handle the original format (change date to datetime)
    return dateString.split("T")[0];
}


async function uploadToTransaktor(transactions = {}) {
    url = "https://transaktor.bermudez.ca/transactions/upload/"
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(transactions), // body data type must match "Content-Type" header
    });

    let data = await response.json()

    if (data.created) {
        alert(`${data.created.length} Transactions uploaded successfully to Transaktor`)
    }
    console.log(data); 
}

async function getDataFromScotiaBank() {
    // get path without querystring
    var path = window.location.pathname;

    // remove /acccounts from path
    path = path.replace('/accounts/', '');

    
    let response = await fetch(`https://secure.scotiabank.com/api/${path}/transactions?limit=300`)
    data =  await response.json()
    data = data.data

    let mapper = t => {
        return {
            id: t.id,
            date: parseDate(t.transactionDate),
            description: t.description,
            amount: t.transactionType == "DEBIT" ? - t.transactionAmount.amount : t.transactionAmount.amount,
        }
    }

    // Process pending transactions 
    let pendingTransactions = data.pending.map(mapper)

    // Process pending transactions 
    let settledTransactions = data.settled.map(mapper)

    // Combine both transactions
    let transactions = pendingTransactions.concat(settledTransactions)

    uploadToTransaktor(transactions)
}

let url = window.location.href


if (url.includes('scotiabank')) {
    getDataFromScotiaBank();
}

