#!/bin/bash

generate_json() {
    folder=$1
    output=$2
    tmp=$(mktemp).json

    if [[ -d ${folder} ]]
    then

        if [[ -f ${output} ]]
        then
            cp ${output} ${tmp}
            echo "Updating ${output}"
        else
            echo "Creating ${output}"
        fi

        for nota_md in ${folder}/*.md
        do
            if [[ ${nota_md} = *"Errej"* ]]
            then
                continue
            fi
            echo "Reading ${nota_md}"
            node parseLibrary.js "${nota_md}" "${tmp}"
        done
        mv $tmp $output
        chmod o+r ${output}
        chmod g+r ${output}
    else
        echo "Folder ${folder} not found"
    fi
}

generate_json Libros libros.json
generate_json Videojuegos videojuegos.json
