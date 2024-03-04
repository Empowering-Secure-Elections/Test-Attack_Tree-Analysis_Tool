import csv
import json
import pandas as pd
import re

class Election_Trees():
    
    __init__(self)

    def threat_list_to_csv(file_in,file_out):
        """converts a text document, space separated list to a csv list

        Args:
            file_in (file): file to be read
            file_out (file): csv file of the input file
            
        Side Effects:
        Creates a csv file
        """
        with open(file_in) as f_in, open(file_out) as f_out:
            for i in f_in:
                line = i.strip().split(" ",2)
                new_line = ",".join(line)
                f_out.write(new_line+"\n")


    def tab_indent(f1,f2):
        """A method to format Election Threat csv files to tab indented text
        documents.

        Args:
            f1 (file): csv file to conver to tab indented file
            f2 (file): tab indented file

        Side effects:
        Creates a file in the specified directory
        """
        with (open(f1,"r",encoding="utf-8") as f_in, 
            open(f2,"w",encoding='utf-8') as f_out):
                
            df_in=pd.read_csv(f_in,sep=',',header=0)
            gates=["AND","OR"]
            df_in['node_type']=df_in.node_type.replace({'O':'OR'})
            df_in['node_type']=df_in.node_type.replace({'A':'AND'})        
            
        
            for i,row in df_in.iterrows():
                row['threat_description'] = (
                    re.sub(r'\(X[0-9]*\)',"", row['threat_description'])
                    )
                indent_level = round((len(row['outline_number']) // 2) + 1)
                
                if row['node_type'] in gates:
                    new_line=(
                        ("\t"*indent_level) + row["threat_description"] + ";" 
                        + row["node_type"]
                        )
                elif row['node_type'] == 'T':
                    new_line=(("\t"*indent_level)+ 
                            row['threat_description'] + 
                            ";o=" + str(row['Occurrence_Score']) +
                            ";a=" + str(row['AC']/5) +
                            ";t=" + str(row['TD']/5) +
                            ";d=" + str(row['DD']/5)
                            )
                    
                f_out.write(new_line + "\n")

    # Function to convert a CSV to JSON
    # Takes the file paths as arguments
    def make_json(csvFilePath, jsonFilePath):
        
        # create a dictionary
        data = {}
        
        # Open a csv reader called DictReader
        with open(csvFilePath, encoding='utf-8') as csvf:
            csvReader = csv.DictReader(csvf)
            
            # Convert each row into a dictionary and add it to data
            for rows in csvReader:
                rows['threat_action']=rows['threat_action'].strip()
                # Assuming a column named 'threat_action' to be the primary key
            
                key = rows['outline_number']
                data[key] = rows

        # Open a json writer, and use the json.dumps() function to dump data
        with open(jsonFilePath, 'w', encoding='utf-8') as jsonf:
            jsonf.write(json.dumps(data, indent=4))
            
    # Driver Code

    # Decide the two file paths according to your computer system
    csvFilePath = r'dre2.csv'
    jsonFilePath = r'dre.json'

    # Call the make_json function
    make_json(csvFilePath, jsonFilePath)
