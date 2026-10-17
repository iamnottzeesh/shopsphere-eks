# EBS CSI snapshot and restore validation

## Result

An isolated 1Gi encrypted gp3 CSI volume was snapshotted and restored
to a separate volume. The restored proof file matched the source
SHA-256 checksum.

Test date: 2026-10-17
AWS Region: ap-south-1
Test namespace: storage-test

## Resources used

| Resource | Identifier |
|---|---|
| Source EBS volume | vol-0f8c7c2c41f79270c |
| EBS snapshot | snap-0c81bd654345ec3ec |
| Restored EBS volume | vol-0168f7beb4380ef87 |
| StorageClass | gp3-csi |
| Snapshot class | shopsphere-ebs-snapshot-test |

These test volumes and snapshot have been deleted.

## Validation

- Source and restored PVCs were Bound, each with 1Gi capacity.
- Source and restored Pods were Ready.
- Snapshot reported readyToUse=true.
- Restored data was mounted read-only by the verifier.
- The verifier did not create the proof file.
- Source and restored volumes had different AWS volume IDs.
- Both proof files passed SHA-256 validation.

Verified SHA-256:

a3889de00cf702ca517830dba1d77f049a47d78c0e6816b9023a6729d31a2f4a

## Evidence

- captured-at.txt: evidence capture time in UTC.
- resources.txt: pre-cleanup Pods and PVCs.
- snapshot.yaml: historical VolumeSnapshot status.
- snapshot-content.yaml: historical snapshot handle and status.
- volumes.txt: source and restored volume identities.
- checksums.txt: source and restored checksum verification.
- cleanup-verification.txt: post-cleanup verification.

Evidence YAML files are historical exports, not deployment manifests.
Do not apply files from this documentation directory.

## Reproduction

Review prerequisites, resource names and costs before running.

1. Confirm EBS CSI driver, snapshot controller and snapshot CRDs exist.
2. Confirm the gp3-csi StorageClass exists and uses ebs.csi.aws.com.
3. Apply storage/tests/source.yaml.
4. Wait for the source Pod to be Ready and verify its checksum.
5. Apply storage/tests/snapshot.yaml.
6. Wait for source-snapshot status.readyToUse=true.
7. Apply storage/tests/restore.yaml.
8. Wait for the restored Pod to be Ready.
9. Compare source/restored checksums and AWS volume IDs.
10. Capture evidence before cleanup.

Do not bulk-apply all manifests without the readiness checks.

## Cleanup performed

The shared StorageClass uses Retain. Only the two verified test PVs
were changed to Delete before removing their Pods and PVCs.

AWS describe-volumes returned [] for both test volume IDs.
The test VolumeSnapshot used deletionPolicy: Delete.
AWS describe-snapshots returned [] for the test snapshot ID.

The test snapshot class and namespace were then removed.
The shared gp3-csi StorageClass was not changed.

## Scope and limitations

This validates a same-region, isolated file-volume snapshot/restore.
The source writer flushed its data and did not modify it during capture.

It does not validate application-consistent Redis backups, full-cluster
recovery, cross-region recovery or recovery-time objectives.

Redis and monitoring PVCs were not migrated or restored in this test.
Do not reuse historical resource IDs for cleanup of a future test.
