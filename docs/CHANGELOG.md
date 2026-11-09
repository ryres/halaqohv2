# Changelog

## 2026-09-02 - Clustering engine and visualization

- Cluster labels in the API and exports are now one-based: `C1` through `Ck`; internal algorithm assignments remain zero-based.
- Python is the only clustering engine and uses deterministic Manhattan distance with median centroids.
- The result page now uses a scatter plot of student points grouped by cluster instead of the centroid radar chart.
- Removed the unused global clustering frontend loader and unreferenced legacy result templates.
- Input validation now prevents invalid `k`, iteration counts, and datasets smaller than `k`.
- Both clustering engines reject invalid direct calls, preventing infinite centroid initialization loops.
- Python now validates finite feature values and uses deterministic farthest-point initialization with five restarts to reduce poor local solutions.
- Unknown engine values are rejected instead of silently switching algorithms; empty Python datasets return safely.
- Cluster summaries and bar charts now use `C1` through `Ck` as their identity, so clusters sharing one performance category are not merged or hidden.

Rollback guide: revert the commit or restore the files listed by `git diff --name-status` for this change. No database schema changes were made.
