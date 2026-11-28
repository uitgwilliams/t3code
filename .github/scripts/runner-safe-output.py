import sys

# The runner's trace writer can crash on surrogate pairs in test output.
for line in sys.stdin:
    sys.stdout.write(line.encode("ascii", "backslashreplace").decode("ascii"))
