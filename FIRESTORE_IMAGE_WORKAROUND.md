# Temporary Workaround: Store Compressed Images in Firestore

## ⚠️ Important Notes

This is a **temporary workaround** if you cannot enable Firebase Storage. It has limitations:
- Firestore document size limit: 1MB
- More expensive than Storage
- Slower performance
- Should only be used temporarily

## Implementation

### Step 1: Update Payment Dialog

The image compression we already implemented will help keep files small enough for Firestore.

### Step 2: Convert to Base64 and Store in Firestore

Instead of uploading to Storage, we'll store the compressed image as base64 in the document:

```typescript
const handleSubmitPayment = async () => {
  // ... validation ...
  
  setIsSubmitting(true);
  
  try {
    console.log('Starting payment submission...');
    
    // Convert compressed image to base64
    const reader = new FileReader();
    reader.readAsDataURL(paymentScreenshot);
    
    const base64Image = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    
    // Check size (must be < 900KB to fit in 1MB document with other data)
    const sizeInBytes = base64Image.length * 0.75; // Approximate
    if (sizeInBytes > 900 * 1024) {
      throw new Error('Image too large even after compression. Please use a smaller image.');
    }

    const paymentDetails = {
      method: "GCash",
      transactionId: transactionId,
      paymentDate: new Date().toISOString(),
      screenshotBase64: base64Image, // Store base64 instead of URL
    };

    console.log('Updating document request status...');
    await updateDocumentRequestStatus(request.id, 'Payment Submitted', paymentDetails);
    
    toast({
      title: "Payment Submitted",
      description: "Your payment proof has been uploaded.",
    });
    
    // Reset form
    setTransactionId('');
    handleRemoveFile();
    onClose();
  } catch (error: any) {
    console.error('Payment submission error:', error);
    toast({ 
      title: "Submission Failed", 
      description: error.message || "An error occurred.",
      variant: "destructive" 
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Step 3: Update Receipt to Display Base64 Image

In the receipt component, check for both URL and base64:

```typescript
{paymentDetails?.screenshotUrl && (
  <img src={paymentDetails.screenshotUrl} alt="Payment Proof" />
)}

{paymentDetails?.screenshotBase64 && (
  <img src={paymentDetails.screenshotBase64} alt="Payment Proof" />
)}
```

## Limitations

1. **Size Limit**: Images must be < 900KB after compression
2. **Cost**: More expensive than Storage
3. **Performance**: Slower to load receipts
4. **Scalability**: Not recommended for production

## When to Use This

- ✅ Temporary solution while fixing Storage setup
- ✅ Testing/development
- ✅ Very low volume (< 100 uploads)

## When NOT to Use This

- ❌ Production with many users
- ❌ High-resolution images
- ❌ Long-term solution

## Migrate to Storage Later

Once Storage is enabled:
1. Deploy storage rules
2. Remove base64 code
3. Use original Storage upload code
4. Optionally migrate existing base64 images to Storage
