
let gems = []

async function getData(){
    try {
        await fetch("./data/Gems.json")
            .then(response => response.json())
            .then(data => resources = data);

    }catch (e) {}
}

// getData("","Engineering")


var app = new Vue({
    el: '#app',
    data: {
        gems:[]
    },
    created(){
        fetch("./data/Gems.json")
            .then(response => response.json())
            .then(data => this.gems = Object.values(data));
    }
})
