mkdir -p "../screaming-frog/$1"

screamingfrogseospider --crawl "$1" --overwrite --headless --output-folder "../screaming-frog/$1" --export-tabs "Internal:All,External:All"

awk -F '","'  'BEGIN {OFS=","} { if (toupper($3) == "404")  print }' "../screaming-frog/$1/internal_all.csv" | awk -F"," '{print $1}' > "../screaming-frog/$1/bad_internal.csv"

awk -F '","'  'BEGIN {OFS=","} { if (toupper($3) == "404")  print }' "../screaming-frog/$1/external_all.csv" | awk -F"," '{print $1}' > "../screaming-frog/$1/bad_external.csv"
