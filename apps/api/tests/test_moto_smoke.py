"""Prove the AWS client mocking harness is wired (DDB arrives in Phase 2)."""

import boto3
from moto import mock_aws


@mock_aws
def test_dynamodb_list_tables_empty() -> None:
    client = boto3.client("dynamodb", region_name="us-east-1")
    assert client.list_tables()["TableNames"] == []
