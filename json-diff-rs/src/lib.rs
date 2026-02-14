// Use #[neon::export] to export Rust functions as JavaScript functions.
// See more at: https://docs.rs/neon/latest/neon/attr.export.html

use neon::types::extract::Error;
use serde_json::Value;

#[neon::export]
fn json_diff(input1: String, input2: String) -> Result<String, Error> {
    let a: Value = serde_json::from_str(&input1)
        .map_err(|e| Error::new(format!("Invalid JSON from first argument: {e}")))?;

    let b: Value = serde_json::from_str(&input2)
        .map_err(|e| Error::new(format!("Invalid JSON from second argument: {e}")))?;

    let diff = serde_json_diff::values(a, b);

    let json_string = serde_json::to_string(&diff)
        .map_err(|e| Error::new(format!("Failed to serialize diff: {e}")))?;

    Ok(json_string)
}
