const nvt_oid = '1.3.6.1.4.1.25623.1.0.106223'
const target = 'localhost'

// Base config: Empty and static configuration template.
const base = '085569ce-73ed-11df-83c3-002264764cea';

// Scanner config: OpenVAS Default
const scanner_id = '08b69003-5fc2-4037-a479-93b440211c73';

let config_id = ''

gmp.scanconfig.create({
        base: base,
        name: nvt_oid,
        comment: '',
        scanner_id: scanner_id
    })
    .then(
        response => {
            return response.data.id
        }, err => {
            // console.log('Config exist');
            return gmp.scanconfigs.get({
                filter: 'name=' + nvt_oid
            }).then(
                response => {
                    // console.log(response.getEntries()[0].id)
                    return response.getEntries()[0].id
                }
            )
        })
    .then(
        configid => {
            console.log(configid)
            config_id = configid
            let nvts = {
                '1.3.6.1.4.1.25623.1.0.14259': '1',
                '1.3.6.1.4.1.25623.1.0.100315': '1'
            }
            Promise.all([
                gmp.scanconfig.saveScanConfigFamily({
                    config_name: nvt_oid,
                    family_name: 'Port Scanners',
                    id: configid,
                    selected: nvts
                }),
                gmp.nvt.get({
                    id: nvt_oid
                }).then(
                    response => {
                        let nvt = response.data
                        let family = nvt.family
                        return family
                    }
                ).then(family => {
                    let nvts = {
                        [nvt_oid]: '1'
                    }
                    gmp.scanconfig.saveScanConfigFamily({
                        config_name: nvt_oid,
                        family_name: family,
                        id: configid,
                        selected: nvts
                    })
                }),
                // console.log(configid)
            ]).then(values => {
                console.log('Config ID: ' + configid)
            })
        }
    ).then(res => {
        // console.log('weiter geht es')
        return gmp.target.create({
            name: target,
            hosts: target,
            target_source: 'manual',
            port_list_id: 'c7e03b6c-3bbe-11e1-a057-406186ea4fc5',
            port: 22,
            alive_tests: 'Scan Config Default'
        }).then(
            response => {
                console.log(response.data.id)
            }, err => {
                // console.log('Fehler target exist')
                return gmp.targets.get({
                    filter: 'name=' + target
                }).then(response => {
                    // console.log(response.getEntries()[0].id)
                    return response.getEntries()[0].id
                })
            }).then(target_id => {
            // console.log('go on!!');
            let date = new Date().toISOString();
            let name = target + '_' + nvt_oid + '_' + date;
            return gmp.task.create({
                name: name,
                config_id: config_id,
                target_id: target_id,
                scanner_id: scanner_id,
                scanner_type: '1',
                in_assets: '1',
                apply_overrides: '1',
                min_qod: '',
                auto_delete: 'keep',
                auto_delete_data: '5',
                alterable: '1'
            })
        }).then(task => {
            let task_id = task.data.id;
            gmp.task.start({
                id: task_id
            })
        })
    });