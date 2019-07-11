import getPreload from "./preload.js"; // preload query taken from BIMvie.ws

const SERVER_ADDRESS = "http://localhost:8082";
const USERNAME = "";
const PASSWORD = "";

document.getElementById("btnTestPreload").addEventListener("click", () => {
    runTest(true);
});

document.getElementById("btnTestWithoutPreload").addEventListener("click", () => {
    runTest(false);
});

function runTest(testWithPreload) {
    console.clear();
    document.getElementById("products").innerHTML = "";
    const client = new bimserverapi.BimServerClient(SERVER_ADDRESS);

    client.callPromise = function(service, method, params) {
        return new Promise((resolve, reject) => {
            this.call(
                service,
                method,
                params,
                data => {
                    resolve(data);
                },
                err => {
                    reject(err);
                }
            );
        });
    };

    client.init().then(() => {
        client.login(
            USERNAME,
            PASSWORD,
            () => {
                onClientReady();
            },
            () => {
                alert(`Can't login. Server: ${SERVER_ADDRESS}. Username: ${USERNAME}. Password: ${PASSWORD}`);
            }
        );
    });

    function onClientReady() {
        console.log("Client ready!");
        let currentProject;

        client
            .callPromise("ServiceInterface", "getAllProjects", { onlyTopLevel: true, onlyActive: true })
            .then(projects => projects[0])
            .then(project => {
                console.log(project);
                currentProject = project;
                return modelForProject(project);
            })
            .then(model => {
                console.log("Model loaded", model);
                if (testWithPreload) {
                    console.log("Test with preload");
                    prelaodModel(model, currentProject.schema).then(() => {
                        testGetAllSubtypesOfProduct(model);
                    });
                } else {
                    console.log("Test without preload");
                    testGetAllSubtypesOfProduct(model);
                }
            });
    }

    function modelForProject(project) {
        const poid = project.oid;
        const roid = project.lastRevisionId;
        const schema = project.schema;

        return new Promise((resolve, reject) => {
            client.getModel(
                poid,
                roid,
                schema,
                false,
                loadedModel => {
                    console.log("Modello caricato!");
                    resolve(loadedModel);
                },
                "TestModel"
            );
        });
    }

    function prelaodModel(model, schema) {
        return new Promise(resolve => {
            model
                .query(getPreload(schema), () => {}, () => {})
                .done(() => {
                    resolve();
                });
        });
    }

    function testGetAllSubtypesOfProduct(model) {
        const ifcProducts = [];
        model
            .getAllOfType("IfcProduct", true, data => {
                ifcProducts.push(data);
            })
            .done(() => {
                console.log(ifcProducts);
                ifcProducts.forEach(p => {
                    const li = document.createElement("li");
                    li.innerText = `${p.object._i} - ${p.object._t}`;
                    document.getElementById("products").appendChild(li);
                });
            });
    }
}
