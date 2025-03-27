import { VNPay, ProductCode, VnpLocale } from "vnpay";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { amount, ipAddr, txnRef, orderInfo, returnUrl } = await req.json();

    const tmnCode = process.env.VNP_TMNCODE;
    const secureSecret = process.env.VNP_SECURE_SECRET;
    const vnpayHost = process.env.VNP_VNPAY_HOST;

    if (!tmnCode || !secureSecret) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const vnpay = new VNPay({
      tmnCode: tmnCode,
      secureSecret: secureSecret,
      vnpayHost: vnpayHost,
    });

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: VnpLocale.VN, // 'vn'
    });

    return NextResponse.json({ paymentUrl }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}