import arg from 'arg';
import inquirer from 'inquirer';
import _ from 'underscore';

import imb from "./index";

/**
 * This is the primary CLI
 * @param args
 * @returns {Promise<void>}
 */
export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    options = await promptForSpecifics(options);

    console.log(options);

    if (options.type === 'decode') {
        try {
            console.log("\nDecoded output");
            _.each(imb.decode(options.barcode), (value, key) => console.log('\t', key, ':\t', value))
        } catch (ex) {
            console.error(ex.message);
        }
    }

    if (options.type === 'encode') {
        options = _.omit(options, 'type');
        try {
            console.log("\nEncoded output\n\t", imb.encode(options));
        } catch(ex) {
            console.error(ex.message);
        }
    }
}

function parseArgumentsIntoOptions(rawArgs) {

    const args = arg(
        {
            // Decode: IMB String
            '--barcode': String,
            '-b': '--barcode',

            // Encode: IMB Object
            '--IMB': Boolean,
            '-i': '--IMB',
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        barcode:    args._[0] || args['--barcode'] || false,
        input:      args['--imb'] || false,
    };
}

async function promptForMissingOptions(options) {

    if (options.barcode) {
        options.type = "barcode"
    }

    if (options.input) {
        options.type = "input"
    }

    const questions = [];

    const DEFAULT_ACTION = 'decode';
    if (!options.type) {
        questions.push({
            type: 'list',
            name: 'type',
            message: 'Would you like to encode or decode an IMB?',
            choices: ['encode', 'decode'],
            default: DEFAULT_ACTION,
        });
    }

    // if (!options.git) {
    //     questions.push({
    //         type: 'confirm',
    //         name: 'git',
    //         message: 'Initialize a git repository?',
    //         default: false,
    //     });
    // }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        type: options.type || answers.type,
        // git: options.git || answers.git,
    };
}

async function promptForSpecifics(options) {
    const questions = [];

    if (options.type === 'decode') {
        questions.push({
            type: 'input',
            name: 'barcode',
            message: 'Barcode String:',
            suffix: "EX: ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT",
            validate: (answer) => {
                return !answer || /^[ADFT]{65}$/.test(answer)
                    ? true
                    : "Must be 65 numbers"
            }
        });
    }

    if (options.type === 'encode') {
        questions.push(
            {
                type: 'input',
                name: 'delivery_pt',
                message: 'Delivery Point 2-Characters (Optional):',
                validate: (answer) => {
                    return !answer || /^\d{2}$/.test(answer)
                        ? true
                        : "Must be blank or 2 numbers"
                }
            },{
                type: 'input',
                name: 'zip',
                message: 'Zip (Optional):',
                validate: (answer) => {
                    return !answer || /^\d{5}$/.test(answer)
                        ? true
                        : "Must be blank or 5 numbers"
                }
            },{
                type: 'input',
                name: 'plus4',
                message: 'Zip Plus 4 (Optional):',
                validate: (answer) => {
                    return !answer || /^\d{4}$/.test(answer)
                        ? true
                        : "Must be blank or 4 numbers"
                }
            },{
                type: 'input',
                name: 'barcode_id',
                message: 'Barcode ID:',
                validate: (answer) => {
                    return /^\d[0-4]$/.test(answer)
                        ? true
                        : "Must be 2 numbers and 2nd number must be < 5"
                }
            },{
                type: 'input',
                name: 'service_type',
                message: 'Service Type:',
                validate: (answer) => {
                    return /^\d{3}$/.test(answer)
                        ? true
                        : "Must be 3 numbers"
                }
            },{
                type: 'input',
                name: 'mailer_id',
                message: 'USPS Mailer ID:',
                validate: (answer) => {
                    return /^(\d{6}|\d{9})$/.test(answer)
                        ? true
                        : "Must be 6 or 9 numbers"
                }
            },{
                type: 'input',
                name: 'serial_num',
                message: 'USPS Serial Number:',
                validate: (answer, answers) => {
                    switch(answers.mailer_id.length) {
                        case 6:
                            return /^\d{9}$/.test(answer)
                                ? true
                                : "Must be 9 numbers if Mailer ID is 6 numbers";
                        case 9:
                            return /^\d{6}$/.test(answer)
                                ? true
                                : "Must be 6 numbers if Mailer ID is 9 numbers";
                        default:
                            return "Unrecognized [Mailer ID]. Please cancel and try again.";
                    }
                }
            }
        );
    }

    const answers = await inquirer.prompt(questions);
    return _.pick({
        ...options,
        barcode:        options.barcode || answers.barcode,
        delivery_pt:    options.delivery_pt || answers.delivery_pt,
        zip:            options.zip || answers.zip,
        plus4:          options.plus4 || answers.plus4,
        barcode_id:     options.barcode_id || answers.barcode_id,
        service_type:   options.service_type || answers.service_type,
        mailer_id:      options.mailer_id || answers.mailer_id,
        serial_num:     options.serial_num || answers.serial_num
    }, _.identity);
}