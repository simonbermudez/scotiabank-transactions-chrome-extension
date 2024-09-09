function parseDate(dateStr) {
    // Create a new Date object from the input date string
    const date = new Date(dateStr);

    // Get the year, month, and day from the Date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
    const day = String(date.getDate()).padStart(2, '0'); // Ensure day is two digits

    // Format the date as YYYY-MM-DD
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

const processTransactionsNodeList = (transactionsNodeList) => {
    if (!transactionsNodeList) {
        return []
    }
    const transactions = Array.from(transactionsNodeList.querySelectorAll("tr:not([class])")).flatMap(transaction => {
        console.log("processing transaction")
        try {
            amount = transaction.querySelectorAll("td")[2].innerText ? - Number(transaction.querySelectorAll("td")[2].innerText) : Number(transaction.querySelectorAll("td")[3].innerText)
            return {
                date: parseDate(transaction.querySelector("th").innerText),
                description: transaction.querySelectorAll("td")[1].innerText.split("\n")[0],
                amount: amount ? amount : 0,
            }
        } catch (e) {
            console.log("error processing transaction")
            return []
        }
    })
    console.log(transactions)
    return transactions
}

const getTransactions = () => {
    console.log("Loading Transactions...")
    const accountName = document.querySelector(".regular-data-account-details > h3").innerText
    const [pendingTransactions, postedTransactions] = document.querySelectorAll(".thtable")
    return {accountName, transactions: processTransactionsNodeList(pendingTransactions).concat(
        processTransactionsNodeList(postedTransactions)
    ).map(transaction => {
        return {
            id: `${accountName}-${transaction.date}-${transaction.description}-${transaction.amount}`.replaceAll(" ", "-"),
            ...transaction,
        }})
    }
}

async function uploadToServer(data = {}) {
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
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    console.log(response.json()); // parses JSON response into native JavaScript objects
  }

const scrapeTransactions = async () => {
    console.log("Scraping Transactions")
    chrome.runtime.sendMessage({gettingTransactions: true}, (response) => {
        console.log(response)
    })
    return getTransactions()
}
window.onload = async (event) => {
    console.log('page is fully loaded');
    scrapeTransactions().then(transactions => {
        console.log(transactions)
        chrome.storage.local.set({ transactions: transactions }, function(){
            console.log('Value is set to ', transactions);
        });
        console.log("uploading to server");
        // post request to server to save transactions
        uploadToServer(transactions.transactions);
    }
    )
};

// fetch('https://secure.scotiabank.com/api/credit/oCc0iMeTf6Zl8cfTtN7vzClkiKrr5IZFteusH3DOjFU=/transactions?limit=100')
//     .then(response => response.json())
//     .then(data => console.log(data))
//     .catch(error => console.error(error))
