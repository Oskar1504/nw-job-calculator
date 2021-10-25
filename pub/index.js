let skillLevel = [],
    resourceRecipes = [],
    resources = []


async function getSkillLevel(categorie, name){
    try {
        await fetch(`./data/exp_tables/${categorie}/${name}.json`)
            .then(response => response.json())
            .then(data => skillLevel = data);

        await fetch("./data/resources.json")
            .then(response => response.json())
            .then(data => resources = data);

        await fetch("./data/recipes/" + name + '_recipes.json')
            .then(response => response.json())
            .then(data => app._data.recipes = data)
            .catch(error => app._data.recipes = [])

        await fetch('./data/recipes.json')
            .then(response => response.json())
            .then(data => resourceRecipes = data);

        let o = parseInt(app._data.form.startLevel) + 1
        app._data.form.startLevel = o
        o = parseInt(app._data.form.startLevel) - 1
        app._data.form.startLevel = o

    }catch (e) {}

}

getSkillLevel("crafting","engineering")


var app = new Vue({
    el: '#app',
    data: {
        form:{
            startLevel:1,
            targetLevel:50,
            selectedJob:"engineering",
            recipe:1,
            selectedCategorie:"crafting",
            gatheringValue:166
        },
        recipes: [],
        options:{
            categories:["crafting","gathering"],
            crafting:["arcana","armoring","cooking","engineering","furnishing","jewelcraft","weaponsmithing"],
            gathering:["logging","mining","fishing","harvesting","skinning"]
        },
        history:{
            keys:[],
            selectedList:""
        },
        chart:{
            visible:false
        }
    },
    computed:{
        stats:function(){
            let expNeeded = this.calculateExperience(),
                craftingAmount = Math.ceil(expNeeded[0]/this.form.recipe.experience),
                rawResources = [],
                ingredients = this.form.recipe.ingredients
            if(ingredients){
                rawResources = getRawItems(ingredients)
            }
            if(skillLevel.length > 0){this.updateChart()}

            return {
                rawResources:rawResources,
                expNeeded:expNeeded[0],
                startExp:expNeeded[1],
                targetExp:expNeeded[2],
                craftingAmount: craftingAmount
            }
        }
    },
    created(){
        this.updateHistory()
    },
    methods: {
        deformat: function (number) {
            return new Intl.NumberFormat('de-DE').format(number)
        },
        calculateExperience: function () {
            let o = 0,
                start = this.form.startLevel,
                end = this.form.targetLevel,
                startExp = 0,
                targetExp = 0

            skillLevel.forEach(level => {
                if(level.level == start){
                    startExp = parseInt(level["exp (total)"].replace(/,/g,""))
                }
                if(level.level == end){
                    targetExp = parseInt(level["exp (total)"].replace(/,/g,""))
                }
            })
            o = targetExp - startExp
            return [o,startExp,targetExp]
        },
        updateSkillLevel: function () {
            getSkillLevel(this.form.selectedCategorie, this.form.selectedJob)
            this.updateChart()
        },
        saveHistory: function () {
            let key = `lvl_${this.form.selectedJob}_${this.form.startLevel}_${this.form.targetLevel}`
            localStorage.setItem(key,JSON.stringify(this.form))
            this.updateHistory()
        },
        updateHistory: function () {
            let o = []
            Object.keys(localStorage).forEach(key => {
                if(key.includes("_") && key.includes("lvl")){
                    o.push(key)
                }
            })
            this.history.keys = o
        },
        removeHistory:function () {
            localStorage.removeItem(this.history.selectedList)
            this.updateHistory()
        },
        loadHistory: function () {
            this.form = JSON.parse(localStorage.getItem(this.history.selectedList))
            getSkillLevel(this.form.selectedCategorie, this.form.selectedJob)
        },
        updateChart:function () {
            if(this.chart.visible){
                let labels = [],data = []
                for(let i = parseInt(this.form.startLevel)-1; i < parseInt(this.form.targetLevel);i++){
                    labels.push(skillLevel[i].level)
                    data.push(skillLevel[i]["exp (total)"].replace(/,/g,""))
                }
                myChart.data.labels = labels
                myChart.data.datasets[0].label = this.form.selectedJob
                myChart.data.datasets[0].data = data
                myChart.update()
            }
        }

    }
})

function getRawItems(ingredients){
    let raw_items =  [], crafted_items = [], output = {}, counter = 0
    do {
        ingredients.forEach(ingredient => {
            //if recipe found
            if (resourceRecipes[ingredient.name]) {
                // check resource recipe
                resourceRecipes[ingredient.name].ingredients.forEach(resource => {
                    // if ingredient !type raw added to new iteration
                    if (resources[resource.name].type == "raw") {
                        let raw_item = JSON.parse((JSON.stringify(resource)))
                        raw_item.amount *= ingredient.amount
                        raw_items.push(raw_item)
                    } else {
                        // need to calculate new amount
                        let item = JSON.parse((JSON.stringify(resource)))
                        item.amount *= ingredient.amount
                        crafted_items.push(item)
                    }
                })
            }else{
                let raw_item = JSON.parse((JSON.stringify(ingredient)))
                raw_items.push(raw_item)
            }
        })
        ingredients = crafted_items
        crafted_items = []
        // error safe
        counter++
    }while (ingredients.length > 0 && counter < 10)

    // merge items
    raw_items.forEach(ingredient => {
        if(output[ingredient.name]){
            output[ingredient.name].amount += ingredient.amount
        }else{
            // deep copy
            output[ingredient.name] = JSON.parse(JSON.stringify(ingredient))
        }
    })
    // reform and sort to array since object structe used to merge efficient
    let l = Object.values(output)
    l.sort(function (a, b) {
        return b.amount - a.amount;
    });
    return l
}


const cdata = {
    labels: ["a","b"],
    datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(13,110,253)',
        borderColor: 'rgb(13,110,253)',
        data: [0, 10],
    }]
};

const config = {
    type: 'line',
    data: cdata,
    options: {
        scales: {
            y:  {
                display: true,
                title: {
                    display: true,
                    text: 'Exp total'
                }
            },
            x:  {
                display: true,
                title: {
                    display: true,
                    text: 'Level'
                }
            }
        }
    }
};

var myChart = new Chart(
    document.getElementById('myChart'),
    config
);
