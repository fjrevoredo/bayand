pub mod password;

use zeroize::ZeroizeOnDrop;

/// Wrapper for heap-allocated secret bytes that zeroes memory on drop.
///
/// Use this instead of a bare `Vec<u8>` for sensitive key material so that
/// memory is reliably overwritten even when the caller forgets to call
/// `.zeroize()` explicitly.
#[derive(ZeroizeOnDrop)]
pub struct SecretBytes(pub Vec<u8>);

impl std::ops::Deref for SecretBytes {
    type Target = [u8];
    fn deref(&self) -> &[u8] {
        &self.0
    }
}

impl std::fmt::Debug for SecretBytes {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "SecretBytes([REDACTED; {}])", self.0.len())
    }
}

impl PartialEq<Vec<u8>> for SecretBytes {
    fn eq(&self, other: &Vec<u8>) -> bool {
        self.0 == *other
    }
}

impl PartialEq<SecretBytes> for Vec<u8> {
    fn eq(&self, other: &SecretBytes) -> bool {
        *self == other.0
    }
}

impl PartialEq<SecretBytes> for SecretBytes {
    fn eq(&self, other: &SecretBytes) -> bool {
        self.0 == other.0
    }
}
